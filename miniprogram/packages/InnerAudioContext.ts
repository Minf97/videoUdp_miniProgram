
// 播放音频相关

export const InnerAudioContext = wx.createInnerAudioContext({
    useWebAudioImplement: true
});
// 播放器
InnerAudioContext.autoplay = true;

InnerAudioContext.onCanplay(() => {
    console.log("audio can play");
})
InnerAudioContext.onPlay(() => {
    console.log("audio start");
})
InnerAudioContext.onStop(() => {
    console.log("audio stop");
})
InnerAudioContext.onEnded(() => {
    console.log("audio end");
})
InnerAudioContext.onError(() => {
    console.log("audio err");
})
wx.onAudioInterruptionBegin(() => {
    console.log("AudioInterruptionBegin");
})
// 播放器end