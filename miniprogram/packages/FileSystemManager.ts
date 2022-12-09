export class FileSystemManager {
    public fs: WechatMiniprogram.FileSystemManager;

    constructor() {
        this.fs = wx.getFileSystemManager();
    }

    readFile(filePath: string) {
        return new Promise((reslove, reject) => {
            this.fs.readFile({
                filePath,
                success: (res: object) => {
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

    getFileInfo(filePath) {
        return new Promise((reslove, reject) => {
            this.fs.getFileInfo({
                filePath,
                success: res => {
                    reslove(res);
                },
                fail: err => {
                    reject(err);
                }
            })
        })
    }

    saveFile(tempFilePath, filePath) {
        return new Promise((reslove, reject) => {
            this.fs.saveFile({
                tempFilePath,
                filePath,
                success: res => {
                    reslove(res);
                },
                fail: err => {
                    reject(err);
                }
            })
        })
    }

    downloadFile(url) {
        return new Promise((reslove, reject) => {
            wx.downloadFile({
                url,
                success: res => {
                    reslove(res);
                },
                fail: err => {
                    reject(err);
                }
            })
        })
    }
}