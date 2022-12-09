


export const InnerAudioContext = wx.createInnerAudioContext({
    useWebAudioImplement: true
});

// 播放器
InnerAudioContext.autoplay = true;
InnerAudioContext.onCanplay(() => {
    console.log("audio can play");
})
InnerAudioContext.onWaiting(() => {
    console.log("audio waiting");
})
InnerAudioContext.onTimeUpdate(() => {
    console.log("audio timeupdate");
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