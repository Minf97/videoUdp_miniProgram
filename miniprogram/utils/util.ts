export const formatTime = (prevTime: number) => {
    const now = Date.now();
    const time = now - prevTime;

    const hour = Math.floor((time / 1000 / 60) / 60);
    const minute = Math.floor((time - (hour * 1000 * 60 * 60)) / 1000 / 60);
    const second = Math.floor((time - (hour * 1000 * 60 * 60) - (minute * 1000 * 60)) / 1000)

    return [hour, minute, second].map(formatNumber).join(' : ')
}

const formatNumber = (n: number) => {
    const s = n.toString()
    return s[1] ? s : '0' + s
}


/**
 * 16进制转字符串
 * @param hex 16进制数
 */
export function hexToStr(hex: string | number) {
    hex = hex.toString();
    let b: any = [];
    if (hex.length % 2 != 0) {
        return b
    }
    for (let i = 0; i < hex.length; i += 2) {
        b.push(Math.floor(hex.substring(i, i + 2), 16))
    }
    return b
}

/**
 * 字符串转ascii码值
 * @param str 字符串
 */
export function strToAscii(str: string): string {
    var val = "";
    for (var i = 0; i < str.length; i++) {
        if (val == "")
            val = str.charCodeAt(i).toString(10);
        else
            val += "," + str.charCodeAt(i).toString(10);
    }
    return val;
}

/**
 * 将字符串转化为16进制的arraryBuffer
 * @param str 字符串
 */
export function stringToArrayBuffer(str: string) { // utf16 不管是字符还是汉字
    let buffer = new ArrayBuffer(str.length);
    let view = new Uint8Array(buffer);
    for (let i = 0; i < str.length; i++) {
        view[i] = str.charCodeAt(i)
    }
    view[35] = 1;
    return buffer
}


/**
 * 将arraryBuffer转化为数组
 * @param arr arraryBuffer
 */
export function ab2ToArr(arr: ArrayBufferLike) {
    return Array.prototype.slice.call(new Uint8Array(arr))
}

/**
 * 将数组转化为arrayBuffer
 * @param arr 数组
 */
export function arrayToAb2(arr: any[]) {
    let buffer = new ArrayBuffer(arr.length);
    let view = new Uint8Array(buffer)
    for (let i = 0; i < arr.length; i++) {
        view[i] = Number(arr[i]);
    }
    return buffer
}