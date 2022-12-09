import { ab2ToArr, arrayToAb2, strToAscii } from "./util";
import { decryptVideo, decryptAudio, decryptResponse } from "./decrypt";
import { hexMD5 } from "./md5"
import { pcm_wav } from "./pcm_to_wav";
import { UDPSocket } from "./Udp";
import { WebSocket } from "./WebSocket";
import {
    ADDRESS_UDPSOCKET,
    ADDRESS_USER,
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
import { TOAST_NETWORKBAD } from "../constants/config";

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
        this.wsSocket.connectSocket().then(() => {
            this.wsSocket.onOpen(() => {
                this.device_id = device_id;
                this.device_key = device_key;
                this.wsSocket.ws_send(`cmd=subscribe&topic=device_${device_id}&from=control&device_id=${device_id}&device_key=${device_key}`)
            })
        })
    }


    /**
     * 2. ws组装要发送的信息并发送
     * @param msg 要发送的信息
     * @param cmd 命令
     */
    assembleDataSend(msg, cmd) {
        const timestamp1 = Date.parse(new Date() as any);
        const message = `cmd=publish&topic=control_${this.device_id}&device_id=${this.device_id}&device_key=${this.device_key}&message={"cmd":${cmd},"pv":0,"sn":"${timestamp1}","msg":${msg}}`;

        console.log("通过 socket 发送的 message :", message);
        this.wsSocket.ws_send(message)
    }

    callToDevice(session_id) {
        const msg = {
            attr: [110, 111, 112],
            data: {
                110: session_id,
                111: 1,
                112: 3,
            }
        }
        this.assembleDataSend(JSON.stringify(msg), 3);
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
        clearInterval(this.udpVideoTimer);
        this.udpVideoTimer = setInterval(() => {
            this.udpVideoSocket.send(message)
        }, CONNECTION_VIDEOCHANNEL_TIMEOUT)
    }


    /**
     * 3. udp订阅音频流 http://doc.doit/project-23/doc-266/
     * @param data 发送的数据
     */
    subscribeAudio(data: subscribeHeader) {
        InnerAudioContext.loop = false;
        clearInterval(this.udpAudioTimer);
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
            this.udpAudioTimer = setInterval(() => {
                let audioDataArr: any = [];
                if (this.stackAudio.length > 1280)
                    audioDataArr = this.stackAudio.splice(0, 1280);
                else if (this.stackAudio.length > 960)
                    audioDataArr = this.stackAudio.splice(0, 960);
                else if (this.stackAudio.length > 640)
                    audioDataArr = this.stackAudio.splice(0, 640);
                else if (this.stackAudio.length > 320)
                    audioDataArr = this.stackAudio.splice(0, 320);
                else return;

                const messageArr = [...message, ...audioDataArr];
                // 发包
                if (audioDataArr.length > 100) {
                    this.udpAudioSocket.send(arrayToAb2(messageArr))
                }
            }, CONNECTION_AUDIOCHANNEL_TIMEOUT)
        })
        this.onMessageUDPAudio(res => {
            const dateNow = Date.now();
            const view = pcm_wav(res, '8000', '16', '1');
            this.fs.writeFile(view, `${wx.env.USER_DATA_PATH}/${dateNow}.wav`).then(() => {
                InnerAudioContext.src = `${wx.env.USER_DATA_PATH}/${dateNow}.wav`;
            }).catch(() => { })
        })
    }

    /**
     * 视频接听
     */
    videoAnswer() {
        let msg = {
            attr: [109, 110, 112, 117],
            data: {
                109: 1,
                110: wx.getStorageSync("session_id"),
                112: 3,
                117: 3 //内网通信+
            }
        }
        this.assembleDataSend(JSON.stringify(msg), 3);
    }

    /**
     * 语音接听
     */
    audioAnswer() {
        let msg = {
            attr: [109, 110, 112, 117],
            data: {
                109: 1,
                110: wx.getStorageSync("session_id"),
                112: 2,
                117: 3 //内网通信+公网通信
            }
        }
        this.assembleDataSend(JSON.stringify(msg), 3);
    }

    noAnswer() {
        let msg = {
            attr: [109, 110],
            data: {
                109: 2,
                110: wx.getStorageSync("session_id"),
            }
        }
        this.assembleDataSend(JSON.stringify(msg), 3);
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
        // 发送心跳包保持连接，（视频也一直在发）
        clearInterval(this.udpAudioTimer);
        this.udpAudioTimer = setInterval(() => {
            this.udpAudioSocket.send(message)
        }, CONNECTION_TIMEOUT)
        // 移除监听
        this.udpVideoSocket.offMessage();
        this.udpAudioSocket.offMessage();
        // 停止一些服务
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
            wx.showLoading({
                title: "请稍等..."
            });
            recorder.start(options);
            wx.hideLoading();
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
        if (command == true) {
            InnerAudioContext.volume = 1;
            console.log("开启扬声器");
        }
        if (command == false) {
            InnerAudioContext.volume = 0;
            console.log("关闭扬声器");
        }
    }


    /**
     * websocket的监听回调函数
     * @param fn 外部使用箭头函数
     */
    onMessageWS(fn: Function) {
        this.wsSocket.ws.onMessage(res => {
            console.log(res);

            const response = decryptResponse(res.data);
            // 订阅时
            if (typeof (response) == "string") {
                response.indexOf('res=1') == -1 ? fn({ res: "订阅设备失败" }) : fn({ res: "订阅设备成功" });
            }
            // 正常消息
            if (typeof (response) == "object") {
                console.log(response);
                // http://doc.doit/project-5/doc-8/
                const {
                    device_request_call,
                    device_request_call_reason,
                    session_id,
                    user_call,
                    call_type,
                    device_close_reason,
                    video_resolution,
                    video_fps,
                } = response

                if (device_request_call == 1) {
                    fn({
                        res: "设备发起呼叫",
                        session_id: session_id
                    });
                }
                else if (user_call == 1) {
                    fn({
                        res: "设备应答呼叫",
                        session_id: session_id
                    });
                }
                else if (device_close_reason == 1) {
                    fn({
                        res: "接听关闭",
                        session_id: session_id
                    })
                }
                else if (device_close_reason == 2) {
                    fn({
                        res: "连接超时",
                        session_id: session_id
                    })
                }
                else {
                    fn({
                        res: "解析错误！请打印response看看什么问题"
                    })
                }
            }
            // 解析格式错误
            if (typeof (response) == "undefined") {
                fn({
                    res: "解析错误！请打印res看看什么问题"
                });
            }
        })
    }


    /**
     * udpVideo的监听回调函数
     * @param fn 外部使用箭头函数
     */
    onMessageUDPVideo(fn: Function) {
        let pre = Date.now();
        this.udpVideoSocket.onMessage(res => {
            let now = Date.now();
            decryptVideo(res).then(video => {
                if (now - pre >= TOAST_NETWORKBAD) {
                    networkBad();
                }
                pre = now;
                const base64Img = wx.arrayBufferToBase64(video as ArrayBufferLike);
                fn(base64Img);
            }).catch((err) => {
                // console.log(err, "报错了捏video");
            });
        })
    }

    /**
     * udpAudio的监听回调函数
     * @param fn 外部使用箭头函数
     */
    onMessageUDPAudio(fn: Function) {
        this.udpAudioSocket.onMessage(res => {
            decryptAudio(res).then(res => {
                fn(res);
            }).catch(() => { })
        })
    }

    /**
     * 注册账号 http://doc.doit/project-12/doc-274/
     * @param username 用户名
     * @param password 密码
     */
    register(username: string, password: string) {
        const appid = '1';
        const timestamp = Date.parse(new Date() as any);
        const app_secret = '1';
        const sign = hexMD5(appid + timestamp + app_secret);

        return new Promise((reslove, reject) => {
            wx.request({
                method: 'POST',
                url: `${ADDRESS_USER}/api/access_application/user/register`, //仅为示例，并非真实的接口地址
                data: {
                    username,
                    password
                },
                header: {
                    'appid': appid,
                    'timestamp': timestamp,
                    'sign': sign,
                },
                success: res => {
                    reslove(res)
                },
                fail: err => {
                    reject(err)
                }
            })
        })
    }

    /**
     * 登录账号 http://doc.doit/project-12/doc-275/
     * @param username 用户名
     * @param password 密码
     */
    login(username: string, password: string) {
        const appid = '1';
        const timestamp = Date.parse(new Date() as any);
        const app_secret = '1';
        const sign = hexMD5(appid + timestamp + app_secret);

        return new Promise((reslove, reject) => {
            wx.request({
                method: 'POST',
                url: `${ADDRESS_USER}/api/access_application/user/login`, //仅为示例，并非真实的接口地址
                data: {
                    username,
                    password
                },
                header: {
                    'appid': appid,
                    'timestamp': timestamp,
                    'sign': sign,
                },
                success: res => {
                    reslove(res)
                },
                fail: err => {
                    reject(err)
                }
            })
        })
    }
}

/**
 * 网络差的情况
 */
function networkBad() {
    wx.showToast({
        title: "网络不佳",
        icon: "none",
        duration: 1500
    })
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