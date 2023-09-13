/* eslint-disable no-console */
import { setting } from './global';
class Log {
    log(...strArr:string[]) {
        console.log(strArr.join(','));
    }
    logCollect(...strArr:string[]) {
        if(setting.isPrintCollect) {
            console.log(strArr.join(','));
        }
    }
}

export const log = new Log();