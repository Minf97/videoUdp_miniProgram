import { PATH_BELLRING } from "../../constants/server";
import { media } from "../../packages/Control"
import { InnerAudioContext } from "../../packages/InnerAudioContext";

Page({
    data: {

    },
    onLoad() {
        InnerAudioContext.loop = true;
        InnerAudioContext.src = PATH_BELLRING;
    },
    videoAnswer() {
        media.videoAnswer();
        wx.navigateTo({
            url: "../call/call?isVideo=true"
        })
        InnerAudioContext.stop()
    },
    audioAnswer() {
        media.audioAnswer();
        wx.navigateTo({
            url: "../call/call?isVideo=false"
        })
        InnerAudioContext.stop()
    },
    noAnswer() {
        media.noAnswer();
        wx.showLoading({
            title: "请稍等..."
        })
        setTimeout(() => {
            wx.hideLoading()
            wx.navigateBack();
            InnerAudioContext.stop()
        }, 300)
    },
})