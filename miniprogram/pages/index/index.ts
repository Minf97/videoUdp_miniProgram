import { media } from "../../packages/Control";
import { DEVICE_ID, DEVICE_KEY } from "../../constants/config"
import { ADDRESS_BELLRING, PATH_BELLRING } from "../../constants/server";

const fs = wx.getFileSystemManager();
Page({
    data: {
        imageSrc: "../../assets/images/init.png",
        content: [
            {
                time: "2020-11-10 15:12",
                text: "鱼人在门前出现"
            },
            {
                time: "2020-11-10 15:12",
                text: "鱼人在门前出现"
            },
            {
                time: "2020-11-10 15:12",
                text: "鱼人在门前出现"
            },
            {
                time: "2020-11-10 15:12",
                text: "鱼人在门前出现"
            },
        ],
        isBellOn: true
    },

    onLoad() {
        this.downloadBellRing();
        media.subcribe(DEVICE_ID, DEVICE_KEY)
        media.onMessageWS(response => {
            const { res } = response
            if (res == "设备发起呼叫") {
                wx.setStorageSync("session_id", response.session_id)
                wx.navigateTo({
                    url: "../callByDevice/callByDevice",
                })
            }
            if (res == "设备应答呼叫") {
                wx.setStorageSync("session_id", response.session_id)
                wx.navigateTo({
                    url: "../call/call?isVideo=true",
                })
            }
            if (res == "接听关闭") {
                wx.showToast({
                    title: "接听关闭",
                    icon: "none",
                    duration: 3000
                });
            }
            if (res == "连接超时") {
                wx.showToast({
                    title: "连接超时",
                    icon: "none",
                    duration: 3000
                });
            }
        })
    },

    callToDevice() {
        wx.showLoading({
            title: "加载中"
        });

        let session_id;
        if (wx.getStorageSync("session_id")) {
            session_id = wx.getStorageSync("session_id")
        }
        else {
            // 随机生成session_id
            session_id = parseInt((Math.random() * 9000 + 1000) as unknown as string).toString();
            wx.setStorageSync("session_id", session_id)
        }

        media.callToDevice(session_id);
    },

    downloadBellRing() {
        wx.showLoading({
            title: "请稍等..."
        })
        fs.getFileInfo({
            filePath: PATH_BELLRING,
            success: () => wx.hideLoading(),
            fail: () => {
                wx.downloadFile({
                    url: ADDRESS_BELLRING,
                    success: res => {
                        wx.hideLoading();
                        fs.saveFileSync(res.tempFilePath, PATH_BELLRING);
                    }
                })
            }
        })
    }
})

