

import { ab2ToArr, hexToStr } from "./util";

const STACKAUDIO_LENGTH = 8960;

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

    }
    setContent(audioContent: any[]) {
        this.audioContent = this.audioContent.concat(audioContent as any)
    }
    getContent(): number[] {
        return this.audioContent.splice(0, STACKAUDIO_LENGTH)
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
    return new Promise((reslove, reject) => {
        const len = message.byteLength,
            // version = message.slice(0, 1),
            // device_id = message.slice(1, 21),
            // session_id = message.slice(21, 25),
            // session_status = message.slice(25, 26),
            audioContent = ab2ToArr(message.slice(26, len));

        stackAudio.setContent(audioContent);

        if (stackAudio.audioContent.length >= STACKAUDIO_LENGTH) {
            let audio = arrayToAb2(stackAudio.getContent());
            reslove(audio)
        }
        else {
            reject(`数量小于 ${STACKAUDIO_LENGTH} :` + stackAudio.audioContent.length)
        }
    })

}

type decryptResponse = {
    device_request_call: string | undefined
    device_request_call_reason: string | undefined
    session_id: string | undefined
    user_call: string | undefined
    call_type: string | undefined
    device_close_reason: string | undefined
    video_resolution: string | undefined
    video_fps: string | undefined
}

/**
 * 解密设备端的应答信息 http://doc.doit/project-5/doc-8/
 * @param deviceResponse 设备的应答信息
 */
export function decryptResponse(deviceResponse):decryptResponse | string | undefined {
    if (deviceResponse.indexOf("message=") == -1) return deviceResponse;
    const dataMsg = deviceResponse.split("message=")[1];
    const message = JSON.parse(dataMsg);
    const cmd = message.cmd;
    if (message.msg != undefined && message.msg.data != undefined) {
        const dpid = message.msg.data;
        // 可能收到的信息包括 101,107,110,111,112,114,115,116
        return {
            device_request_call: dpid["101"],
            device_request_call_reason: dpid["107"],
            session_id: dpid["110"],
            user_call: dpid["111"],
            call_type: dpid["112"],
            device_close_reason: dpid["114"],
            video_resolution: dpid["115"],
            video_fps: dpid["116"],
        }
    }
    return;
}




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




