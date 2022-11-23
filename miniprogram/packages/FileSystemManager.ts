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
            this.fs.writeFile({
                data,
                filePath,
                success: (res: any) => {
                    reslove(res)
                },
                fail: (err: any) => {
                    reject(err)
                }
            })
        })
    }
}