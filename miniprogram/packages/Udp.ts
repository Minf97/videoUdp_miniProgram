

// class UDPSocket extends demo {}
export class UDPSocket {
    public udp: WechatMiniprogram.UDPSocket;
    public address: string;
    public port: number;
    public pre = 0;

    constructor(option: WechatMiniprogram.UDPSocketConnectOption) {
        this.udp = wx.createUDPSocket();
        this.address = option.address;
        this.port = option.port;
    }

    bind() {
        return this.udp.bind();
    }

    send(message: string | ArrayBufferLike) {
        this.udp.send({
            address: this.address,
            port: this.port,
            message: message
        })
        const now= Date.now();
        // console.log("send", this.address, this.port, "send23333", now - this.pre);
        this.pre = now;
    }

    connect() {
        this.udp.connect({
            address: this.address,
            port: this.port
        })
    }

    // write(message) {
    //     this.udp.write({
    //         address: this.address,
    //         port: this.port,
    //         message: message
    //     })
    //     console.log(message, this.address, this.port);
    // }

    close() {
        this.udp.close();
    }

    onMessage(fn: Function) {
        this.udp.onMessage(res => {
            const { message } = res;
            fn(message);
        })
    }

    offMessage() {
        this.udp.offMessage();
    }
}