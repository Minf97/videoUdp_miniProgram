
// 录音相关

export const recorder = wx.getRecorderManager();
export const options: WechatMiniprogram.RecorderManagerStartOption = {
    duration: 600000, //指定录音的时长，单位 ms
    sampleRate: 8000, //采样率
    numberOfChannels: 1, //录音通道数
    encodeBitRate: 16000, //编码码率
    format: 'PCM', //音频格式，有效值 aac/mp3等  
    frameSize: 1,  // 2kb
}
recorder.onStart(() => {
    console.log('recorder start');
})
recorder.onPause(() => {
    console.log('recorder pause');
})
recorder.onStop((res) => {
    console.log('recorder stop', res)
    if (res.duration >= 600000) {
        recorder.start(options);   //重新开始录音
    }
})