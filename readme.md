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

[&#10008;] 未对网络不好的情况做处理

[&#10004;] 主动呼叫/被动呼叫设备开启音视频