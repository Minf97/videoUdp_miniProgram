import { ADDRESS_WEBSOCKET } from "../../constants/server";
import { webSocket } from "../../packages/webSocket";

export const ws = new webSocket(ADDRESS_WEBSOCKET);


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
        ws.connectSocket().then(res => {
            console.log(res);
            ws.ws.onMessage(res => {
                let msg = res.data as string;

                const dataMsg = msg.split("message=")[1];
                if (dataMsg != undefined) {
                    const message = JSON.parse(dataMsg);
                    console.log(message, "解析完成");
                    const cmd = message.cmd;
                    if (message.msg != undefined && message.msg.data != undefined) {
                        const dpid = message.msg.data;
                        // 收到的信息包括 101,107,110,111,112,115,116
                        const device_request_call = dpid["101"];
                        const device_request_call_reason = dpid["107"];
                        const session_id = dpid["110"];
                        const user_call = dpid["111"];
                        const call_type = dpid["112"];
                        const video_resolution = dpid["115"];
                        const video_fps = dpid["116"];

                        wx.setStorageSync("session_id", session_id);
                        // 如果设备发起呼叫，则跳转
                        if (device_request_call == 1) {
                            wx.navigateTo({
                                url: "../callByDevice/callByDevice",
                            })
                        }
                        // 设备应答
                        if(user_call == 1) {
                            wx.navigateTo({
                                url: "../call/call?isVideo=true",
                            })
                        }
                    }
                }
            })
        });

        ws.onOpen(() => {
            ws.subcribe("66901360c8478c002332", "1519053727");
        })
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

        let msg = {
            attr: [110, 111, 112],
            data: {
                110: session_id,
                111: 1,
                112: 3,
            }
        }
        ws.assembleDataSend(JSON.stringify(msg), 3);
    }
})

