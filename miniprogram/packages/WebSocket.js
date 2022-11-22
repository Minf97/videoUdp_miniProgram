// 1.7.0 及以上版本，最多可以同时存在 5 个 WebSocket 连接。
// 1.7.0 以下版本，一个小程序同时只能有一个 WebSocket 连接，如果当前已存在一个 WebSocket 连接，会自动关闭该连接，并重新创建一个 WebSocket 连接。

export class WebSocket {
    public url: string;
    public ws: WechatMiniprogram.SocketTask | any;

    constructor(url: string) {
        this.url = url;
    }

    connectSocket() {
        return new Promise((reslove, reject) => {
            this.ws = wx.connectSocket({
                url: this.url,
                success: () => {
                    reslove("连接成功")
                },
                fail: err => {
                    reject(err)
                }
            })
        })
    }

    ws_send(data) {
        console.log(typeof (data));

        return new Promise((reslove, reject) => {
            this.ws.send({
                data: data,
                success: (res) => {
                    reslove("ws_send_success:" + res)
                },
                fail: err => {
                    reject(err);
                }
            })
        })
    }

    /**
     * 订阅指定设备device_id
     */
    subcribe(device_id: string, device_key: string) {
        this.ws_send(`cmd=subscribe&topic=device_${device_id}&from=control&device_id=${device_id}&device_key=${device_key}`)
    }

    assembleDataSend(msg, cmd) {
        // let { device_key, device_id } = getApp().globalData.openDeviceInfo;
        let device_key = '1519053727';
        let device_id = '66901624c8478c000018';
        let timestamp1 = Date.parse(new Date() as any);
        // 订阅
        this.ws_send(`cmd=subscribe&topic=device_${device_id}&from=control&device_id=${device_id}&device_key=${device_key}`)
        let message = `cmd=publish&topic=control_${device_id}&device_id=${device_id}&device_key=${device_key}&message={"cmd":${cmd},"pv":0,"sn":"${timestamp1}","msg":${msg}}`;
        console.log("通过 socket 发送的 message.......", message);
        this.ws_send(message)
    }

    /**
     * websocket连接打开
     * @param fn 要执行的函数
     */
    onOpen(fn) {
        this.ws.onOpen(() => {
            return fn();
        })
    }
}