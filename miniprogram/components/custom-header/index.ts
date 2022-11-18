
const app = getApp();
Component({
    properties: {

    },
    data: {
        // 状态栏高度
        statusBarHeight: app.globalData.statusBarHeight,
        // 头部高度
        customBar: (app.globalData.top - app.globalData.statusBarHeight) * 2 + app.globalData.height
    },
    methods: {

    }
})
