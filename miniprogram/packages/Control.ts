import { ab2ToArr, arrayToAb2, strToAscii } from "../utils/util";
import { decryptVideo, decryptAudio } from "../utils/decrypt"
import { pcm_wav } from "./pcm_to_wav";
import { UDPSocket } from "./Udp";
import { WebSocket } from "./WebSocket";
import {
    ADDRESS_UDPSOCKET,
    ADDRESS_WEBSOCKET,
    CONNECTION_AUDIOCHANNEL_TIMEOUT,
    CONNECTION_TIMEOUT,
    CONNECTION_VIDEOCHANNEL_TIMEOUT,
    PORT_AUDIO,
    PORT_VIDEO
} from "../constants/server";
import { options, recorder } from "./RecorderManager";
import { InnerAudioContext } from "./InnerAudioContext";
import { FileSystemManager } from "./FileSystemManager";

interface subscribeHeader {
    version: string | number
    token: string
    session_id: string | number
    session_status: string | number
}

type MediaParam = {
    wsAddress: string,
    UDPAudio: WechatMiniprogram.UDPSocketConnectOption
    UDPVideo: WechatMiniprogram.UDPSocketConnectOption
}


class Media {
    public udpVideoSocket: UDPSocket
    public udpAudioSocket: UDPSocket
    public wsSocket: WebSocket
    public udpVideoTimer: any        // 控制udp视频通信的定时器
    public udpAudioTimer: any        // 控制udp语音通信的定时器
    public device_id: any
    public device_key: any
    public stackAudio: any[] = [];
    public fs = new FileSystemManager();

    constructor(MediaParam: MediaParam) {
        this.udpAudioSocket = new UDPSocket(MediaParam.UDPAudio);
        this.udpVideoSocket = new UDPSocket(MediaParam.UDPVideo);
        this.wsSocket = new WebSocket(MediaParam.wsAddress);
        this.udpAudioSocket.bind();
        this.udpVideoSocket.bind();
    }

    /**
     * 1. ws订阅指定设备device_id
     */
    subcribe(device_id: string, device_key: string) {
        this.device_id = device_id;
        this.device_key = device_key;
        this.wsSocket.ws_send(`cmd=subscribe&topic=device_${device_id}&from=control&device_id=${device_id}&device_key=${device_key}`)
    }

    /**
     * 2. ws组装要发送的信息并发送
     * @param msg 要发送的信息
     * @param cmd 命令
     */
    assembleDataSend(msg, cmd) {
        let timestamp1 = Date.parse(new Date() as any);
        let message = `cmd=publish&topic=control_${this.device_id}&device_id=${this.device_id}&device_key=${this.device_key}&message={"cmd":${cmd},"pv":0,"sn":"${timestamp1}","msg":${msg}}`;
        console.log("通过 socket 发送的 message.......", message);
        this.wsSocket.ws_send(message)
    }

    /**
     * 3. udp订阅视频流
     * @param data 发送的数据
     */
    subscribeVideo(data: subscribeHeader) {
        const { version, token, session_id, session_status } = data

        // 将数据拼凑出来一个完整包
        let message: any = [
            ...new Array(1).fill(version),
            ...strToAscii(token).split(","),
            ...strToAscii(session_id).split(","),
            ...new Array(1).fill(session_status),
        ];

        // 将包转为ArrayBuffer，便于发包
        message = arrayToAb2(message);

        // 发包
        this.udpAudioTimer = setInterval(() => {
            this.udpVideoSocket.send(message)
        }, CONNECTION_VIDEOCHANNEL_TIMEOUT)
    }

    /**
     * 3. udp订阅音频流 http://doc.doit/project-23/doc-266/
     * @param data 发送的数据
     */
    subscribeAudio(data: subscribeHeader) {
        recorder.onFrameRecorded(res => {
            const { frameBuffer } = res;
            const { version, token, session_id, session_status } = data
            // 将数据拼凑出来一个完整包
            const message: any = [
                ...new Array(1).fill(version),
                ...strToAscii(token).split(","),
                ...strToAscii(session_id).split(","),
                ...new Array(1).fill(session_status),
            ];

            this.stackAudio = this.stackAudio.concat(ab2ToArr(frameBuffer));
            this.udpVideoTimer = setInterval(() => {
                let audioDataArr: any = [];
                if (this.stackAudio.length > 1280)
                    audioDataArr = this.stackAudio.splice(0, 1280);
                else if (this.stackAudio.length > 960)
                    audioDataArr = this.stackAudio.splice(0, 960);
                else if (this.stackAudio.length > 640)
                    audioDataArr = this.stackAudio.splice(0, 640);
                else if (this.stackAudio.length > 320)
                    audioDataArr = this.stackAudio.splice(0, 320);
                else return

                const messageArr = [...message, ...audioDataArr];
                // 发包
                if (audioDataArr.length > 100) {
                    this.udpAudioSocket.send(arrayToAb2(messageArr))
                }
            }, CONNECTION_AUDIOCHANNEL_TIMEOUT)
        })
        this.onMessageUDPAudio(res => {
            const dateNow = Date.now();
            decryptAudio(res).then(res => {
                const view = pcm_wav(res, '8000', '16', '1');
                return this.fs.writeFile(view, `${wx.env.USER_DATA_PATH}/${dateNow}.wav`)
            }).then(res => {
                InnerAudioContext.src = `${wx.env.USER_DATA_PATH}/${dateNow}.wav`;
            }).catch((err) => {})
        })
    }

    /**
     * 4. udp关闭音频流 http://doc.doit/project-23/doc-271/
     */
    closeAudio(data: subscribeHeader) {
        const { version, token, session_id, session_status } = data

        // 将数据拼凑出来一个完整包
        let message: any = [
            ...new Array(1).fill(version),
            ...strToAscii(token).split(","),
            ...strToAscii(session_id).split(","),
            ...new Array(1).fill(session_status),
        ];

        // 将包转为ArrayBuffer，便于发包
        message = arrayToAb2(message);

        // 发空包
        this.udpVideoTimer = setInterval(() => {
            this.udpAudioSocket.send(message)
        }, CONNECTION_AUDIOCHANNEL_TIMEOUT)
    }

    /**
     * 5. ws关闭媒体流连接（销毁该session_id）
     */
    closeMediaConnection(data: subscribeHeader) {
        const { version, token, session_id, session_status } = data;
        const message: any = [
            ...new Array(1).fill(version),
            ...strToAscii(token).split(","),
            ...strToAscii(session_id).split(","),
            ...new Array(1).fill(session_status),
        ];
        const msg = {
            attr: [110, 113],
            data: {
                110: session_id,
                113: 1          //用户主动关闭连接
            }
        }
        this.assembleDataSend(JSON.stringify(msg), 3);
        this.udpAudioTimer = setInterval(() => {
            this.udpAudioSocket.send(message)
        }, CONNECTION_TIMEOUT)
        recorder.stop();
        InnerAudioContext.stop();
        console.log("closeMediaConnection, 结束音视频通话！");
    }

    /**
     * 开启/关闭麦克风
     * @param command 命令，true开启；false关闭
     */
    microState(command: boolean) {
        if (command == true) {
            recorder.start(options);
            console.log("开启麦克风");
        }


        if (command == false) {
            recorder.stop();
            console.log("关闭麦克风");
        }

    }

    /**
     * 开启/关闭扬声器
     * @param command 命令，true开启；false关闭
     */
    speakerState(command: boolean) {
        if (command == true)
            InnerAudioContext.volume = 1;
        console.log("开启扬声器");
        if (command = false)
            InnerAudioContext.volume = 0;
        console.log("关闭扬声器");
    }

    onMessageWS(fn: Function) {
        this.wsSocket.ws.onMessage(res => {
            fn(res)
        })
    }

    onMessageUDPVideo(fn: Function) {
        this.udpVideoSocket.onMessage(res => {
            decryptVideo(res).then(video => {
                fn(video);
            });
        })
    }

    onMessageUDPAudio(fn: Function) {
        this.udpVideoSocket.onMessage(res => {
            const dateNow = Date.now();
            decryptAudio(res).then(res => {
                const view = pcm_wav(res, '8000', '16', '1');
                return this.fs.writeFile(view, `${wx.env.USER_DATA_PATH}/${dateNow}.wav`)
            }).then(res => {
                fn(`${wx.env.USER_DATA_PATH}/${dateNow}.wav`)
            }).catch((err) => {})
        })
    }
}


const option = {
    wsAddress: ADDRESS_WEBSOCKET,
    UDPAudio: {
        address: ADDRESS_UDPSOCKET,
        port: PORT_AUDIO
    },
    UDPVideo: {
        address: ADDRESS_UDPSOCKET,
        port: PORT_VIDEO
    }
}
export const media = new Media(option)