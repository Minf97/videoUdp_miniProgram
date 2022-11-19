

import { ab2ToArr, hexToStr } from "./util";
interface stack {
    clearStack: Function
}
class stackVideoImpl implements stack {
    public frame_index: string | number = 0
    public imageContent: any[] = []
    clearStack() {
        this.frame_index = 0;
        this.imageContent = [];
    }
    setContent(chunk_index: any, imageContent: any) {
        // 如果该分包序号为空，则赋值
        if (this.imageContent[chunk_index] == undefined) {
            this.imageContent[chunk_index] = imageContent;
        }
        // 如果该分包序号不为空，则说明是第二次甚至第三次循环，应加255 + 1
        else {
            this.setContent(chunk_index + 256, imageContent);
        }
    }
    getContent(): number[] {
        return this.imageContent.reduce((prev, cur) => {
            return prev.concat(cur)
        })
    }
}
class stackAudioImpl implements stack {
    public audioContent = [];

    clearStack() {
        this.audioContent.splice(0, 8960);
    }
    setContent(audioContent: any[]) {
        this.audioContent = this.audioContent.concat(audioContent as any)
    }
    getContent(): number[] {
        return this.audioContent
    }
}



// http://doc.doit/project-23/doc-263/
let stackVideo = new stackVideoImpl();
export function decryptVideo(message: ArrayBufferLike) {
    return new Promise((reslove, reject) => {
        const len = message.byteLength;
        let subPackage = {
            version: handleAb2(message.slice(0, 1)),
            device_id: handleAb2(message.slice(1, 21), true),
            session_id: handleAb2(message.slice(21, 25), true),
            session_status: handleAb2(message.slice(25, 26)),
            frame_index: handleAb2(message.slice(26, 27)),
            chunk_index: handleAb2(message.slice(27, 28)),
            chunk_last: handleAb2(message.slice(28, 29)),
            imageContent: ab2ToArr(message.slice(29, len))
        }
        // console.log(stackVideo.frame_index, subPackage.frame_index, "frame_index");
        // console.log(stackVideo.imageContent, subPackage.imageContent, "imageContent");
        // console.log(subPackage.chunk_index, "本次的chunk_index");
        // console.log("1.本次分包的解密信息：", subPackage);


        // 如果帧序不等于当前帧，则丢弃当前帧，只要最新帧
        if (subPackage.frame_index !== stackVideo.frame_index) {
            stackVideo.clearStack();
            stackVideo.frame_index = subPackage.frame_index;
        }
        // 进行分包排序
        stackVideo.setContent(subPackage.chunk_index, subPackage.imageContent);
        // 该帧接收完毕
        if (
            subPackage.chunk_last == 1 &&
            !isArrayHasUndefined(stackVideo.imageContent)
        ) {
            let video = arrayToAb2(stackVideo.getContent());
            stackVideo.clearStack();
            reslove(video);
        }
        if (subPackage.session_status == 0) {
            reject("通话关闭")
        }
    })

}

// http://doc.doit/project-23/doc-264/
let stackAudio = new stackAudioImpl();
export function decryptAudio(message: ArrayBufferLike) {
    const startTime = Date.now();
    return new Promise((reslove, reject) => {
        const len = message.byteLength,
            version = message.slice(0, 1),
            device_id = message.slice(1, 21),
            session_id = message.slice(21, 25),
            session_status = message.slice(25, 26),
            audioContent = ab2ToArr(message.slice(26, len));

        stackAudio.setContent(audioContent);

        if (stackAudio.audioContent.length >= 10240) {
            let audio = arrayToAb2(stackAudio.getContent());
            stackAudio.clearStack();
            const endTime = Date.now();
            console.log("本次20000byte收集需要ms: ", endTime - startTime);

            reslove(audio)
        }
        else {
            reject("数量小于 20000 :" + stackAudio.audioContent.length)
        }
    })

}

// 订阅视频流
// 日期：2022-11-16
// 用于用户侧订阅消息；用户端在内网向设备端推送、在公网向服务器端推送。该消息每隔2秒发送一次
// UDP协议如下
// 长度	含义
// 1	版本号，当前为1
// 30	用户当前的token
// 4	session_id，表示一次通话的随机字符串，一般由设备端生成
// 1	session_status，取值：0、1；1：通话有效；0：通话关闭
export function subcribeVideo(): ArrayBufferLike {

    let arr = [];
    return new Int8Array(arr).buffer
}

// 编写日期： 2022-11-16
// App侧使用该协议在外网向服务器端推送、在内网向设备推送
// 模组原始采集的音频为PCM编码格式，采样率为8Khz，编码为16bit，单声道
// 协议如下：
// 列名	列名
// 1	版本号，当前为1
// 30	用户当前token
// 4	session_id，表示一次通话的随机字符串，一般由设备端生成
// 1	session_status，取值：0、1；1：通话有效；0：通话关闭
// 剩余长度	320字节的整数倍，上限1280字节，发送一般为1280字节








// arrayBuffer处理方法
function handleAb2(ab2: ArrayBufferLike, isStr: boolean = false): string | number {
    // 首先转数组
    let arr = ab2ToArr(ab2);
    // 然后16进制转字符串
    if (isStr) {
        arr = arr.map(item => {
            return hexToStr(item);
        })
    }
    // 最后拼接起来
    return arr.join("")
}

function arrayToAb2(arr: any[]) {
    let buffer = new ArrayBuffer(arr.length);
    let view = new Uint8Array(buffer)
    for (let i = 0; i < arr.length; i++) {
        view[i] = Number(arr[i]);
    }
    return buffer
}

function isArrayHasUndefined(arr: any[]): boolean {
    for (let i = 0; i < arr.length; i++) {
        const element = arr[i];
        if (element == undefined) return true
    }
    return false
}




