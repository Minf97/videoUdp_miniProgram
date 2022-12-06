import { media } from "../../packages/Control";

const DEVICE_ID = "66901624c8478c000018";
const DEVICE_KEY = "1519053727"

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

        // media.wsSocket.connectSocket().then(res => {
        //     console.log(res);

        //     media.wsSocket.onOpen(() => {
        //         console.log(2333);
        //         media.subcribe(DEVICE_ID, DEVICE_KEY);
        //     })

        //     media.onMessageWS(res => {
        //         console.log(res);
        //         if(!res) return;
        //         wx.setStorageSync("session_id", res.session_id);
        //         // 如果设备发起呼叫，则跳转
        //         if (res.device_request_call == 1) {
        //             wx.navigateTo({
        //                 url: "../callByDevice/callByDevice",
        //             })
        //         }
        //         // 设备应答
        //         if (res.user_call == 1) {
        //             wx.navigateTo({
        //                 url: "../call/call?isVideo=true",
        //             })
        //         }
        //     })
            
        // })
        media.subcribe(DEVICE_ID, DEVICE_KEY)

    },

    callToDevice() {
        wx.showLoading({
            title: "加载中"
        });

        let session_id;
        if (wx.getStorageSync("session_id")) {
            session_id = wx.getStorageSync("session_id")
        } else {
            session_id = parseInt((Math.random() * 9000 + 1000) as unknown as string).toString();
            wx.setStorageSync("session_id", session_id)
        }

        const msg = {
            attr: [110, 111, 112],
            data: {
                110: session_id,
                111: 1,
                112: 3,
            }
        }
        media.assembleDataSend(JSON.stringify(msg), 3);
    }
})

