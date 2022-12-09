## 可能见到的单词变量
- decrypt    v. 解密
- assemble   v. 组装/拼接
- device     n. 设备
- subscribe  v. （上行）订阅
- publise    v. （下行）发布


## 目录树
```
miniprogram
├─ app.json
├─ app.ts
├─ app.wxss
├─ assets                           // 静态资源
│  ├─ 8k16bit.pcm               
│  └─ images
│     ├─ bellLogs
│     │  └─ bell.png
│     ├─ call
│     │  ├─ audioCall.png
│     │  ├─ close.png
│     │  ├─ mirco.png
│     │  ├─ mirco_close.png
│     │  ├─ turnAudio.png
│     │  ├─ voice.png
│     │  └─ voice_close.png
│     ├─ callByDevice
│     │  ├─ audio.png
│     │  ├─ close.png
│     │  └─ video.png
│     └─ index
│        ├─ bell.png
│        ├─ bell_active.png
│        ├─ down.png
│        ├─ power.png
│        ├─ power_green.png
│        ├─ setting.png
│        └─ video.png
├─ components                       // 自定义组件
│  └─ custom-header                 // 自定义头部
│     ├─ index.json
│     ├─ index.ts
│     ├─ index.wxml
│     └─ index.wxss
├─ constants                        // 常量
│  ├─ config.ts
│  └─ server.ts
├─ packages                         // 封装的方法类
│  ├─ control.ts                    // 封装的入口
│  ├─ FileSystemManager.ts
│  ├─ InnerAudioContext.ts
│  ├─ pcm_to_wav.ts
│  ├─ RecorderManager.ts
│  ├─ udp.ts
│  └─ webSocket.ts
├─ pages
│  ├─ bellLogs                      // 门铃日志页面
│  │  ├─ bellLogs.json
│  │  ├─ bellLogs.ts
│  │  ├─ bellLogs.wxml
│  │  └─ bellLogs.wxss
│  ├─ call                          // 视频/语音通话页面
│  │  ├─ call.json
│  │  ├─ call.ts
│  │  ├─ call.wxml
│  │  └─ call.wxss
│  ├─ callByDevice                  // 被设备端呼叫页面
│  │  ├─ callByDevice.json
│  │  ├─ callByDevice.ts
│  │  ├─ callByDevice.wxml
│  │  └─ callByDevice.wxss
│  ├─ index                         // 首页
│  │  ├─ index.json
│  │  ├─ index.ts
│  │  ├─ index.wxml
│  │  └─ index.wxss 
│  └─ setting                       // 设置页面
│     ├─ setting.json
│     ├─ setting.ts
│     ├─ setting.wxml
│     └─ setting.wxss
├─ sitemap.json
└─ utils                            // 工具包
   ├─ decrypt.ts
   └─ util.ts

```

## issues
[&#10008;] 通过 `InnerAudioContext` 实现的音频播放，由于实现方式等价于 `播放无数个短音频`，需要频繁改变src。迫于性能需求，需要开启 `useWebAudioImplement`，这导致无法使用听筒功能。

[&#10008;] 外放会录到对方的声音，导致回声。考虑用 `webAudioContext` 处理

[&#10008;] 音频质量有待提高

[&#10004;] 对网络不好的情况做处理  2022-12-06

[&#10004;] 主动呼叫/被动呼叫设备开启音视频

## 使用方法
在页面 `import` 导入 packages 文件夹下的 `Control.ts`，小程序内所有页面公用这一个接口类。
```js
import { media } from "../../packages/Control"
```

在首页进行 websocket 连接，`订阅指定device_id`
```js

```

## 接口范例
下面函数应按顺序使用，已用序号标注

`注意：`全局使用唯一的 `media`，应在需要的页面中`import`引入
```ts
import { media } from "Control"
```

### 1.subcribe 订阅设备，与设备建立连接（在index页面）
```ts
media.subcribe(DEVICE_ID, DEVICE_KEY)
```

### 2.onMessageWS 监听设备，监听来自设备端的信息（在index页面）
```ts
// res所有可能值已在此列出
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
```

### 3.callToDevice 主动呼叫设备（在index页面）
```ts
media.callToDevice(session_id);
```

### 3.videoAnswer 被设备呼叫时，视频接听（在callByDevice页面）
```ts
media.videoAnswer();
```

### 3.audioAnswer 被设备呼叫时，语音接听（在callByDevice页面）
```ts
media.audioAnswer();
```

### 3.noAnswer 被设备呼叫时，拒绝接听（在callByDevice页面）
```ts
media.noAnswer();
```

### 4.onMessageUDPVideo 监听视频流信息 （在call页面）
```ts
const HEADER_SENDMESSAGE = {
    version: 1, // 版本号
    token: wx.getStorageSync("token"), // token-----30字节的token
    session_id: wx.getStorageSync("session_id"), //会话id
    session_status: wx.getStorageSync("session_status"), //会话状态
}

media.subscribeVideo(HEADER_SENDMESSAGE)
media.onMessageUDPVideo(res => {
    // res是每一帧图片内容
    const base64Img = wx.arrayBufferToBase64(res as ArrayBufferLike);
    this.setData({
        imageSrc: `data:image/png;base64,${base64Img}`
    })
})
```

### 4.onMessageUDPAudio 监听音频流信息（在call页面）
```ts
import { media } from "Control"
const HEADER_SENDMESSAGE = {
    version: 1, // 版本号
    token: wx.getStorageSync("token"), // token-----30字节的token
    session_id: wx.getStorageSync("session_id"), //会话id
    session_status: wx.getStorageSync("session_status"), //会话状态
}

media.subscribeAudio(HEADER_SENDMESSAGE);
media.onMessageUDPAudio(res => {
    // res是每一帧音频的资源地址
    InnerAudioContext.src = res;
})
```

### 5.closeMediaConnection 通知设备关闭连接（在call页面）
```ts
const HEADER_SENDMESSAGE = {
    version: 1, // 版本号
    token: wx.getStorageSync("token"), // token-----30字节的token
    session_id: wx.getStorageSync("session_id"), //会话id
    session_status: wx.getStorageSync("session_status"), //会话状态
}
media.closeMediaConnection(HEADER_SENDMESSAGE)
```
