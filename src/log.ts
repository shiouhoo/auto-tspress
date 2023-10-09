/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { setting } from './global';
class Log {
    log(...strArr: any[]) {
        let str = '';
        for(let i = 0;i < strArr.length;i++) {
            str += JSON.stringify(strArr[i], null, 2) + ',';
        }
        console.log(str);
    }
    logCollect(...strArr: any[]) {
        if(setting.isPrintCollect) {
            this.log(strArr);
        }
    }
}

export const log = new Log();