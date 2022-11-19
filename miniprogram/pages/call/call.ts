
import { formatTime, ab2ToArr, arrayToAb2 } from "../../utils/util";
import { FileSystemManager } from "../../packages/FileSystemManager";
import { pcm_wav } from "../../packages/pcm_to_wav";
import { ADDRESS, PORT_AUDIO, PORT_VIDEO } from "../../constants/server";
import { decryptVideo, decryptAudio } from "../../utils/decrypt";
import { UDPSocket } from "../../packages/udp";
import { stringToArrayBuffer } from "../../utils/util";

// 获取应用实例
const recorderManager = wx.getRecorderManager();
const innerAudioContext = wx.createInnerAudioContext({
    useWebAudioImplement: true
});
const fs = new FileSystemManager();
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
    frameSize: 1,  // 2kb
}
let stack: any[] = [];
Page({
    data: {
        // 是否是视频通话
        isVideo: false,
        // 通话开始时间
        startTime: 1668677527288,
        // 通话持续时间
        callDuration: "00 : 00 : 00",
    },
    // 控制udp视频通信的定时器
    udpVideoTimer: 0,
    // 控制udp语音通信的定时器
    udpAudioTimer: 0,
    // 控制通话持续时间的定时器
    durationTimer: 0,
    onLoad(options) {
        const { isVideo } = options;
        this.setData({
            isVideo: isVideo as unknown as boolean
        })
        this.startVideoCall();
        this.demo();
    },

    startTiming() {
        const { startTime } = this.data;
        this.durationTimer = setInterval(() => {
            this.setData({
                callDuration: formatTime(startTime)
            })
        }, 1000)
    },

    startVideoCall() {

        this.prepareVideo();
        this.prepareAudio();

        recorderManager.start(options);
    },

    prepareVideo() {
        // udp连接
        udpVideo.bind();
        udpVideo.connect();

        // 准备发送信息
        let version = 1;
        let token = 'ssssssssssssssssssssssssssssss'
        let session_id = '1677';
        let session_status = '1';
        let message: any = version + token + session_id + session_status;
        message = stringToArrayBuffer(message);
        console.log(message);

        // 轮询发送信息，确保udp保持连接
        this.udpVideoTimer = setInterval(() => {
            udpVideo.write(message);
        }, 2000)

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

    prepareAudio() {
        // udp连接
        udpAudio.bind();
        udpAudio.connect();

        // 监听消息
        udpAudio.udp.onMessage(res => {
            const { message } = res;
            const dateNow = Date.now();

            decryptAudio(message).then(res => {
                const view = pcm_wav(res, '8000', '16', '1');
                return fs.writeFile(view, `${wx.env.USER_DATA_PATH}/${dateNow}.wav`)
            }).then(() => {
                innerAudioContext.src = `${wx.env.USER_DATA_PATH}/${dateNow}.wav`;
                // if (!innerAudioContext.src) {
                //     console.log("是第一次，对src赋值");
                //     innerAudioContext.src = `${wx.env.USER_DATA_PATH}/${dateNow}.wav`;
                // }
                // else {
                //     console.log("写入文件完成，是", `${wx.env.USER_DATA_PATH}/${dateNow}.wav`);
                //     stack.push(`${wx.env.USER_DATA_PATH}/${dateNow}.wav`)
                // }
            }).catch(err => {

            })


            // let pcmbuf = decryptAudio(message);
            // if (typeof (pcmbuf) != 'string') {
            //     const view = pcm_wav(pcmbuf, '8000', '16', '1');
            //     fs.fs.writeFile({
            //         data: view,
            //         filePath: `${wx.env.USER_DATA_PATH}/${dateNow}.wav`,
            //         success: res => {
            //             innerAudioContext.src = `${wx.env.USER_DATA_PATH}/${dateNow}.wav`;
            //         }
            //     })
            // }

        })
    },
    end() {
        udpVideo.close();
        udpAudio.close();
        clearInterval(this.udpVideoTimer);
        clearInterval(this.udpVideoTimer);
        recorderManager.stop();
    },
    demo() {
        let stack = [];
        recorderManager.onFrameRecorded((res) => {
            const { frameBuffer } = res;
            const frameArr = ab2ToArr(frameBuffer);

            // 由于每次最低都有2000B（时间间隔是 120ms），超过了协议1280B，因此用分包发送的方式
            // 将framebuf转数组，每次拿到framebuf就拼接进stack
            // 每次发送就从stack里拿
            stack = stack.concat(frameArr);

            let version = new Array(1).fill(1);
            let token = new Array(30).fill(115)
            let session_id = new Array(4);
            session_id[0] = 49;
            session_id[1] = 54;
            session_id[2] = 55;
            session_id[3] = 55;
            let session_status = new Array(1).fill(1);
            // 轮询发送信息，确保udp保持连接
            this.udpAudioTimer = setInterval(() => {
                let audioData = [];
                if (stack.length > 1280) audioData = stack.splice(0, 1280);
                else if (stack.length > 960) audioData = stack.splice(0, 960);
                else if (stack.length > 640) audioData = stack.splice(0, 640);
                else if (stack.length > 320) audioData = stack.splice(0, 320);
                else return;

                // console.log(audioData.length, "本次要发送的长度");
                let sendMsg: any[] = [];
                sendMsg = sendMsg.concat(version, token, session_id, session_status, audioData);

                let buf = arrayToAb2(sendMsg);
                if (audioData.length > 100) {
                    udpAudio.write(buf);
                }
            }, 30)

        })
    }
})
let startTime;
// 录音
recorderManager.onStart(() => {
    console.log('recorder start');
    startTime = Date.now();
})
recorderManager.onPause(() => {
    console.log('recorder pause')
})
recorderManager.onStop((res) => {
    // return
    console.log('recorder stop', res)
    const { tempFilePath } = res;
    console.log(tempFilePath);

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



// 播放器
innerAudioContext.autoplay = true;

innerAudioContext.onPlay(() => {
    console.log("audio start");
})
innerAudioContext.onStop(() => {
    console.log("audio stop");
})
innerAudioContext.onEnded(() => {
    let src = stack.splice(0, 1).join("");
    console.log("audio end，马上播放" + src);
    let endTime = Date.now();
    console.log("audio end, 本次录音播放时长：", endTime - startTime);

    innerAudioContext.src = src
})