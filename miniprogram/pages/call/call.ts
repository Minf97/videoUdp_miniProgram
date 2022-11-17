import { formatTime } from "../../utils/util";

const app = getApp();
Page({
    data: {
        startTime: 1668677527288,
        callDuration: "",
        isVideo: true,
    },
    timer: 0,
    onLoad() {
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