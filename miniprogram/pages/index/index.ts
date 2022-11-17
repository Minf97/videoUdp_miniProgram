// index.ts

import { FileSystemManager } from "../../packages/FileSystemManager";
import { pcm_wav } from "../../packages/pcm_to_wav";
import { ADDRESS, PORT_AUDIO, PORT_VIDEO } from "../../constants/server";
import { decryptVideo, decryptAudio } from "../../utils/decrypt";
import { UDPSocket } from "../../packages/udp";
import { stringToArrayBuffer } from "../../utils/util";
import { webSocket } from "../../packages/webSocket";


// 获取应用实例
const recorderManager = wx.getRecorderManager();
const innerAudioContext = wx.createInnerAudioContext();
const fs = new FileSystemManager();
const ws = new webSocket();
const udpVideo = new UDPSocket({
    address: ADDRESS,
    port: PORT_VIDEO
});
const udpAudio = new UDPSocket({
    address: ADDRESS,
    port: PORT_AUDIO
});


const options: WechatMiniprogram.RecorderManagerStartOption = {
    duration: 600000, //指定录音的时长，单位 ms
    sampleRate: 8000, //采样率
    numberOfChannels: 1, //录音通道数
    encodeBitRate: 16000, //编码码率
    format: 'PCM', //音频格式，有效值 aac/mp3等  
    frameSize: 10,  // 2kb
}

Page({
    data: {
        imageSrc: "../../assets/images/init.png",
        content: [
            {
                time: "2020-11-10 15:12",
                text: "鱼人在门前出现"
            },
            {
                time: "2020-11-10 15:12",
                text: "鱼人在门前出现"
            },
            {
                time: "2020-11-10 15:12",
                text: "鱼人在门前出现"
            },
            {
                time: "2020-11-10 15:12",
                text: "鱼人在门前出现"
            },
        ]
    },
    timer: 0,

    onLoad() {
        // console.log(hexToStr(113));
        // console.log('s'.charCodeAt(0));

        // let device_id = '1ssssssssssssssssssssssssssssss';
        // let session_id = 'qqqq';
        // let session_status = '1';
        // let message: any = device_id + session_id + session_status;

        // message = stringToArrayBuffer(message);
        // console.log(message);
    },

    start() {

        udpVideo.bind();
        udpVideo.connect();

        let device_id = '1ssssssssssssssssssssssssssssss';
        let session_id = 'qqqq';
        let session_status = '1';
        let message: any = device_id + session_id + session_status;

        message = stringToArrayBuffer(message);
        console.log(message);

        this.timer = setInterval(() => {
            udpVideo.write(message);
        }, 2000)

        udpVideo.udp.onListening(res => {
            console.log(res, 233);
        })

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


        udpAudio.udp.onMessage(res => {
            const { message } = res;
            const {
                device_id,
                session_id,
                session_status,
                data
            } = decryptAudio(message);

            console.log(device_id, session_id, session_status, data);
        })

        // recorderManager.start(options);
    },
    end() {
        udpVideo.close();
        clearInterval(this.timer)
    }
})

// 录音
recorderManager.onStart(() => {
    console.log('recorder start')
})
recorderManager.onPause(() => {
    console.log('recorder pause')
})
recorderManager.onStop((res) => {
    console.log('recorder stop', res)
    const { tempFilePath } = res;
    const dateNow = Date.now();

    fs.readFile(tempFilePath).then(res => {
        const view = pcm_wav((res as any)?.data, '8000', '16', '1');
        return fs.writeFile(view, `${wx.env.USER_DATA_PATH}/${dateNow}.wav`)
    }).then(() => {
        innerAudioContext.src = `${wx.env.USER_DATA_PATH}/${dateNow}.wav`;
    }).catch(err => {
        console.log(err);
    })
})
recorderManager.onFrameRecorded((res) => {
    const { frameBuffer } = res;
    udpAudio?.send(frameBuffer);
})

// 播放器
innerAudioContext.autoplay = true;
innerAudioContext.onPlay(() => {
    console.log("audio start");
})
innerAudioContext.onStop(() => {
    console.log("audio stop");
})