// 1.7.0 及以上版本，最多可以同时存在 5 个 WebSocket 连接。
// 1.7.0 以下版本，一个小程序同时只能有一个 WebSocket 连接，如果当前已存在一个 WebSocket 连接，会自动关闭该连接，并重新创建一个 WebSocket 连接。

export class webSocket {
    public url: string;
    public ws: WechatMiniprogram.SocketTask;

    constructor(url: string) {
        this.url = url;
    }

    connectSocket() {
        return new Promise((reslove, reject) => {
            wx.connectSocket({
                url: this.url,
                success: res => {
                    this.ws = res as unknown as WechatMiniprogram.SocketTask
                    reslove("连接成功")
                },
                fail: err => {
                    reject(err)
                }
            })
        })
    }
}