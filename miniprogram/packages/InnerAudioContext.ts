
// 播放音频相关

export const InnerAudioContext = wx.createInnerAudioContext({
    useWebAudioImplement: true
});
// 播放器
InnerAudioContext.autoplay = true;

InnerAudioContext.onPlay(() => {
    console.log("audio start");
})
InnerAudioContext.onStop(() => {
    console.log("audio stop");
})
InnerAudioContext.onEnded(() => {
    console.log("audio end");
})
// 播放器end