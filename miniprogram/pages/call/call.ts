
import { formatTime } from "../../utils/util";
import { media } from "../../packages/Control"


// 协议请求头
const HEADER_SENDMESSAGE = {
    version: 1,
    token: "ssssssssssssssssssssssssssssss",
    session_id: wx.getStorageSync("session_id"),
    session_status: 1,
}

const InnerAudioContext = wx.createInnerAudioContext({
    useWebAudioImplement: true
});

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
            const base64Img = wx.arrayBufferToBase64(res as ArrayBufferLike);
            this.setData({
                imageSrc: `data:image/png;base64,${base64Img}`
            })
        })

    },

    // 开启音频流通道
    startAudioChannel() {
        media.microState(true);
        media.subscribeAudio(HEADER_SENDMESSAGE);
        media.onMessageUDPAudio(res => {
            console.log(res, InnerAudioContext.src);
            
            InnerAudioContext.src = res;
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
        if (!isOpenMicro == true) {
            media.microState(true);
        }
        if (!isOpenMicro == false) {
            media.microState(false);
        }
        this.setData({ isOpenMicro: !isOpenMicro })
    },

    // 监听扬声器开启/关闭事件
    onChangeLoudSpeaker() {
        const { isOpenLoudSpeaker } = this.data;
        if (!isOpenLoudSpeaker == true) {
            media.speakerState(true);
        }
        if (!isOpenLoudSpeaker == false) {
            media.speakerState(false);
        }
        this.setData({ isOpenLoudSpeaker: !isOpenLoudSpeaker })
    }
})



// 播放器
InnerAudioContext.autoplay = true;
InnerAudioContext.onCanplay(() => {
    console.log("audio can play");
})
InnerAudioContext.onWaiting(() => {
    console.log("audio waiting");
    
})
InnerAudioContext.onTimeUpdate(() => {
    console.log("audio timeupdate");
    
})
InnerAudioContext.onPlay(() => {
    console.log("audio start");
})
InnerAudioContext.onStop(() => {
    console.log("audio stop");
})
InnerAudioContext.onEnded(() => {
    console.log("audio end");
})
InnerAudioContext.onError(() => {
    console.log("audio err");
})
wx.onAudioInterruptionBegin(() => {
    console.log("AudioInterruptionBegin");
})
// 播放器end