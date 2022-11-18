// app.ts
App<IAppOption>({
    globalData: {},
    onLaunch() {
        let systemInfo = wx.getSystemInfoSync();
        let menuInfo = wx.getMenuButtonBoundingClientRect();
        console.log(systemInfo, menuInfo);
        
        this.globalData = Object.assign(this.globalData, systemInfo, menuInfo)
        // 登录
        wx.login({
            success: res => {
                console.log(res.code)
                // 发送 res.code 到后台换取 openId, sessionKey, unionId
            },
        })
    },
})