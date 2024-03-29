/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { config } from './global';
class Log {
    console(obj: any) {
        console.log(obj);
    }
    log(...strArr: any[]) {
        let str = '';
        for(let i = 0;i < strArr.length;i++) {
            let itemStr;
            try{
                itemStr = JSON.stringify(strArr[i], null, 2);
                if (typeof strArr[i] === 'string') {
                // 去除字符串的引号
                    itemStr = itemStr.slice(1, -1);
                }
                str += itemStr + ',';
            }catch(err) {
                console.log('存在环形依赖，使用console.log');
                console.log(strArr[i]);
            }
        }
        console.log(str.slice(0, -1));
    }
    logDebug(...strArr: any[]) {
        if(config.debug) {
            this.log(strArr);
        }
    }
}

export const log = new Log();