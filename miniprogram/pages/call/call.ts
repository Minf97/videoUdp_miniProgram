import { formatTime } from "../../utils/util";

const app = getApp();
Page({
    data: {
        // 是否是视频通话
        isVideo: false,
        // 通话开始时间
        startTime: 1668677527288,
        // 通话持续时间
        callDuration: "00 : 00 : 00",
    },
    timer: 0,
    onLoad() {
        console.log(app.globalData);
        
        const { startTime } = this.data;
        this.timer = setInterval(() => {
            this.setData({
                callDuration: formatTime(startTime)
            })
        }, 1000)
    },
    onShow() {

    },
})