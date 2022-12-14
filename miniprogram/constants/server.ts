

// webSocket地址
export const ADDRESS_WEBSOCKET = 'wss://wss-cn.doiting.com/ws';
// websocket用户连接超时时间：单位ms（心跳包）
export const CONNECTION_WEBSOCKET_TIMEOUT = 6000;




// udp媒体服务器ip地址
export const ADDRESS_UDPSOCKET: string = '192.168.100.245';
// udp端口号
export const PORT_VIDEO: number = 7897;
export const PORT_AUDIO: number = 7896;
// 通用控制udp长连接时间：单位ms（通用心跳包）
export const CONNECTION_TIMEOUT = 2000;
// udp视频通道用户连接超时时间：单位ms（心跳包）
export const CONNECTION_VIDEOCHANNEL_TIMEOUT = 2000;
// udp音频通道用户连接超时时间：单位ms（心跳包）
export const CONNECTION_AUDIOCHANNEL_TIMEOUT = 1000;



// 注册/登录账号的服务器地址
export const ADDRESS_USER = 'http://test.doiting.com';
// 铃声响起的资源地址
export const ADDRESS_BELLRING = 'http://api-cn.doiting.com/static/sound/bellring.wav';
// 铃声响起的本地地址
export const PATH_BELLRING = `${wx.env.USER_DATA_PATH}/bell.wav`;