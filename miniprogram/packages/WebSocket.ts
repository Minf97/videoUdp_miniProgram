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
                success: res => {
                    reslove(res)
                },
                fail: err => {
                    reject(err)
                }
            })
        })
    }

    ws_send(data) {
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
     * websocket连接打开
     * @param fn 要执行的函数
     */
    onOpen(fn) {
        this.ws.onOpen(() => {
            fn();
        })
        this.ws.onError(err => {
            console.log(err, "websocket连接失败");
            wx.showToast({
                title: "websocket连接失败",
                icon: 'none'
            })
        })
    }
}