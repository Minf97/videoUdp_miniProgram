import { ADDRESS_WEBSOCKET } from "../../constants/server";
import { webSocket } from "../../packages/webSocket"

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

                var dataMsg = msg.split("message=")[1];
                if (dataMsg != undefined) {
                    var message = JSON.parse(dataMsg);
                    console.log(message, "解析完成");
                    let cmd = message.cmd;
                    if (message.msg != undefined && message.msg.data != undefined) {
                        const dpid = message.msg.data;
                        // 收到的信息包括 101,107,110,115,116
                        const device_request_call = dpid["101"];
                        const device_request_call_reason = dpid["107"];
                        const session_id = dpid["110"];
                        const video_resolution = dpid["115"];
                        const video_fps = dpid["116"];

                        console.log(device_request_call, dpid[101], dpid["101"] );
                        
                        // 如果设备发起呼叫，则跳转
                        if (device_request_call == 1) {
                            wx.navigateTo({
                                url: "../callByDevice/callByDevice",
                                success: res =>{
                                    console.log(res);
                                    
                                },
                                fail: err =>{
                                    console.log(err);
                                    
                                }
                            })
                        }
                        wx.setStorageSync("session_id", session_id);
                    }
                }
            })
        });
        let msg = {
            attr: [109, 110, 112, 117],
            data: {
                109: 3,
                110: 0,
                112: 0,
                117: 1 //内网通信
            }
        }
        ws.onOpen(() => {
            ws.assembleDataSend(JSON.stringify(msg), 3)
        })
    },
})

