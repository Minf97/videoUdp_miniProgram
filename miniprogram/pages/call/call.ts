
import { formatTime } from "../../utils/util";
import { FileSystemManager } from "../../packages/FileSystemManager";
import { pcm_wav } from "../../packages/pcm_to_wav";
import { decryptVideo, decryptAudio } from "../../utils/decrypt";
import { recorder, options } from "../../packages/RecorderManager";
import { InnerAudioContext } from "../../packages/InnerAudioContext"
import { media } from "../../packages/control"

// 获取应用实例对象
const fs = new FileSystemManager();

// 协议请求头
const HEADER_SENDMESSAGE = {
    version: 1,
    token: "ssssssssssssssssssssssssssssss",
    session_id: wx.getStorageSync("session_id"),
    session_status: 1,
}

Page({
    data: {
        // 是否是视频通话
        isVideo: true,
        // 通话持续时间
        callDuration: "00 : 00 : 00",
        // 是否开启麦克风
        isOpenMicro: true,
        // 是否开启扬声器
        isOpenLoudSpeaker: true,
    },
    // 控制通话持续时间的定时器
    durationTimer: 0,

    onLoad(options) {
        const { isVideo } = options;
        this.setData({
            isVideo: isVideo as unknown as boolean
        })
        this.startVideoCall();
        this.startTiming();
    },

    // 开始倒计时
    startTiming() {
        const startTime = Date.now();
        this.durationTimer = setInterval(() => {
            this.setData({
                callDuration: formatTime(startTime)
            })
        }, 1000)
    },

    // 开始视频通话
    startVideoCall() {
        this.startVideoChannel();
        this.startAudioChannel();
    },

    // 开启视频流通道
    startVideoChannel() {
        media.subscribeVideo(HEADER_SENDMESSAGE)
        media.onMessageUDPVideo(res => {
            decryptVideo(res).then(video => {
                const base64Img = wx.arrayBufferToBase64(video as ArrayBufferLike);
                this.setData({
                    imageSrc: `data:image/png;base64,${base64Img}`
                })
            });
        })

    },

    // 开启音频流通道
    startAudioChannel() {
        recorder.start(options);
        recorder.onFrameRecorded((res) => {
            const { frameBuffer } = res;
            const message = {
                ...HEADER_SENDMESSAGE,
                audioData: frameBuffer
            }
            media.subscribeAudio(message);
        })

        media.onMessageUDPAudio(res => {
            const dateNow = Date.now();
            decryptAudio(res).then(res => {
                const view = pcm_wav(res, '8000', '16', '1');
                return fs.writeFile(view, `${wx.env.USER_DATA_PATH}/${dateNow}.wav`)
            }).then(() => {
                InnerAudioContext.src = `${wx.env.USER_DATA_PATH}/${dateNow}.wav`;
            }).catch(() => { })
        })

    },

    // 断开连接
    closeCall() {
        wx.showLoading({
            title: "正在关闭..."
        })
        setTimeout(() => {
            media.closeMediaConnection(HEADER_SENDMESSAGE)
            wx.hideLoading();
            wx.navigateBack();
        }, 200);

    },

    // 监听语音/视频切换事件
    onChangeSwitch() {
        const { isVideo } = this.data;
        this.setData({ isVideo: !isVideo })
    },

    // 监听麦克风开启/关闭事件
    onChangeMicro() {
        const { isOpenMicro } = this.data;

        if (!isOpenMicro == true)
            recorder.start(options);
        if (!isOpenMicro == false)
            recorder.stop();
        this.setData({ isOpenMicro: !isOpenMicro })
    },

    // 监听扬声器开启/关闭事件
    onChangeLoudSpeaker() {
        const { isOpenLoudSpeaker } = this.data;
        if (!isOpenLoudSpeaker == true)
            InnerAudioContext.volume = 1;
        if (!isOpenLoudSpeaker == false)
            InnerAudioContext.volume = 0;
        this.setData({ isOpenLoudSpeaker: !isOpenLoudSpeaker })
    }
})



