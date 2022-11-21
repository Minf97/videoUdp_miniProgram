
import { formatTime, ab2ToArr, arrayToAb2 } from "../../utils/util";
import { FileSystemManager } from "../../packages/FileSystemManager";
import { pcm_wav } from "../../packages/pcm_to_wav";
import { decryptVideo, decryptAudio } from "../../utils/decrypt";
import { UDPSocket } from "../../packages/udp";
import { strToAscii } from "../../utils/util";
import { recorder, options } from "../../packages/RecorderManager";
import { InnerAudioContext } from "../../packages/InnerAudioContext"
import {
    ADDRESS,
    PORT_AUDIO,
    PORT_VIDEO,
    CONNECTION_VIDEOCHANNEL_TIMEOUT,
    CONNECTION_AUDIOCHANNEL_TIMEOUT
} from "../../constants/server";


// 获取应用实例对象
const fs = new FileSystemManager();
const udpVideo = new UDPSocket({
    address: ADDRESS,
    port: PORT_VIDEO
});
const udpAudio = new UDPSocket({
    address: ADDRESS,
    port: PORT_AUDIO
});
// 获取应用实例对象end

// 协议请求头
const HEADER_SENDMESSAGE = {
    version: new Array(1).fill(1),
    token: new Array(30).fill(115),
    session_id: strToAscii(wx.getStorageSync("session_id")).split(","),
    session_status: new Array(1).fill(1),
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

        src: '',
    },

    // 控制udp视频通信的定时器
    udpVideoTimer: 0,
    // 控制udp语音通信的定时器
    udpAudioTimer: 0,
    // 控制通话持续时间的定时器
    durationTimer: 0,

    audioCtx: wx.createAudioContext('myAudio'),

    onReady() {
        // this.audioCtx = wx.createAudioContext('myAudio');


        this.audioCtx.setSrc("http://ws.stream.qqmusic.qq.com/M500001VfvsJ21xFqb.mp3?guid=ffffffff82def4af4b12b3cd9337d5e7&uin=346897220&vkey=6292F51E1E384E06DCBDC9AB7C49FD713D632D313AC4858BACB8DDD29067D3C601481D36E62053BF8DFEAF74C0A5CCFADD6471160CAF3E6A&fromtag=46");
        console.log("sdfsdf");

        this.audioCtx.play()
    },
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
        recorder.start(options);
    },

    // 开启视频流通道
    startVideoChannel() {
        // udp连接
        udpVideo.bind();
        udpVideo.connect();

        // 准备发送信息
        const version: any = new Array(1).fill(1);
        const token: any = new Array(30).fill(115);
        const session_id: any = strToAscii(wx.getStorageSync("session_id")).split(",");
        const session_status: any = new Array(1).fill(1);
        const sendMsg: any[] = [].concat(version, token, session_id, session_status);
        const buf = arrayToAb2(sendMsg);

        // 轮询发送信息，确保udp保持连接
        this.udpVideoTimer = setInterval(() => {
            udpVideo.write(buf);
        }, CONNECTION_VIDEOCHANNEL_TIMEOUT)

        // 监听消息
        let pre = 0;
        udpVideo.udp.onMessage(res => {
            const { message } = res;
            // console.log("0.收到的总信息：",message);
            decryptVideo(message).then(video => {
                // console.log("2.解密成功", video);
                let base64Img = wx.arrayBufferToBase64(video as ArrayBufferLike);
                // console.log("3.图片转base64", base64Img);
                let now = Date.now();
                console.log("距离上次接收图片已经过去了：", (now - pre) / 1000, "s");
                pre = now;
                this.setData({
                    imageSrc: `data:image/png;base64,${base64Img}`
                })
            });
        })
    },

    // 开启音频流通道
    startAudioChannel() {
        // udp连接
        udpAudio.bind();
        udpAudio.connect();

        // 准备发送信息
        let stack = [];
        recorder.onFrameRecorded((res) => {
            const { frameBuffer } = res;
            const frameArr = ab2ToArr(frameBuffer);

            // 由于每次最低都有2000B（时间间隔是 120ms），超过了协议1280B，因此用分包发送的方式
            // 将framebuf转数组，每次拿到framebuf就拼接进stack
            // 每次发送就从stack里拿
            stack = stack.concat(frameArr);

            const version: any = new Array(1).fill(1);
            const token: any = new Array(30).fill(115);
            const session_id: any = strToAscii(wx.getStorageSync("session_id")).split(",");
            const session_status: any = new Array(1).fill(1);

            // 轮询发送信息，确保udp保持连接
            this.udpAudioTimer = setInterval(() => {
                let audioData = [];
                if (stack.length > 1280)
                    audioData = stack.splice(0, 1280);
                else if (stack.length > 960)
                    audioData = stack.splice(0, 960);
                else if (stack.length > 640)
                    audioData = stack.splice(0, 640);
                else if (stack.length > 320)
                    audioData = stack.splice(0, 320);
                else return;

                const sendMsg: any[] = [].concat(version, token, session_id, session_status, audioData);
                const buf = arrayToAb2(sendMsg);
                if (audioData.length > 100) {
                    udpAudio.write(buf);
                }

            }, CONNECTION_AUDIOCHANNEL_TIMEOUT)
        })

        // 监听消息
        udpAudio.udp.onMessage(res => {
            const { message } = res;
            const dateNow = Date.now();

            decryptAudio(message).then(res => {
                const view = pcm_wav(res, '8000', '16', '1');
                return fs.writeFile(view, `${wx.env.USER_DATA_PATH}/${dateNow}.wav`)
            }).then(() => {
                InnerAudioContext.src = `${wx.env.USER_DATA_PATH}/${dateNow}.wav`;
            }).catch(() => { })
        })
    },

    // 断开连接
    closeCall() {
        udpVideo.close();
        udpAudio.close();
        clearInterval(this.udpVideoTimer);
        clearInterval(this.udpAudioTimer);
        recorder.stop();
        InnerAudioContext.stop();
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
            recorder.start(options);
        if (!isOpenLoudSpeaker == false)
            recorder.stop();
        this.setData({ isOpenLoudSpeaker: !isOpenLoudSpeaker })
    }
})



