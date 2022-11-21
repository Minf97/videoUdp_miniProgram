
import { ADDRESS_WEBSOCKET } from "../../constants/server";
import { webSocket } from "../../packages/webSocket";
import {ws} from "../index/index"

const websocket = ws

Page({
    data: {

    },
    timer: 0,
    onLoad() {

    },
    onShow() {

    },
    videoCall() {
        let msg = {
            attr: [109, 110, 112, 117],
            data: {
                109: 1,
                110: wx.getStorageSync("session_id"),
                112: 3,
                117: 3 //内网通信+
            }
        }
        websocket.assembleDataSend(JSON.stringify(msg), 3);
        wx.navigateTo({
            url: "./../call/call?isVideo=true"
        })
    }
})