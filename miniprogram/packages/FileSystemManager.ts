export class FileSystemManager {
    public fs:WechatMiniprogram.FileSystemManager;

    constructor() {
        this.fs = wx.getFileSystemManager();
        
    }

    readFile(filePath: string) {
        return new Promise((reslove, reject) => {
            this.fs.readFile({
                filePath,
                success: (res:object) => {
                    reslove(res)
                },
                fail: (err: any) => {
                    reject(err)
                }
            })
        })
    }

    writeFile(data: ArrayBufferLike, filePath: string) {
        return new Promise((reslove, reject) => {
            console.log("开始");
            let startTime = Date.now();
            this.fs.writeFile({
                data,
                filePath,
                success: (res: any) => {
                    let endTime = Date.now();
                    console.log("结束，本次写入文件需要ms:", endTime - startTime);
                    startTime = endTime;
                    reslove(res)
                },
                fail: (err: any) => {
                    reject(err)
                }
            })
        })
    }
}