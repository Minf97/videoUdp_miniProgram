import { webSocket } from "./webSocket"

/**
 * 控制扬声器开启/关闭
 * @param command 指令----- true 打开扬声器，false 关闭扬声器
 */
export function controlLoudSpeaker(command: boolean) {
    wx.setInnerAudioOption({
        speakerOn: command
    })
}

export function subscribe() {

}
