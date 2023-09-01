import os from 'os';
import { Params } from '../types';
// 根据系统返回对应文件系统的换行符
function getReturnSymbol() {
    switch (os.platform()) {
    case 'linux':
    case 'darwin': return '\n'; // macOS
    case 'win32': return '\r\n'; // windows
    case 'aix':
    case 'freebsd':
    case 'openbsd':
    case 'sunos':
    default: return '\n';
    }
}

const returnSysbol = getReturnSymbol();

export class MdCreator {
    content: string;
    constructor() {
        this.content = '';
    }
    // 创建标题
    createTitle(level:1|2|3|4|5|6, title:string) {
        this.content += '#'.repeat(level) + ' ' + title + returnSysbol;
    }
    // 创建函数说明
    createUtilsDescription(description: string) {
        this.content += '- description:' + description + returnSysbol;
    }
    // 创建参数
    createParams(params: Params, docs: Record<string, string[][]>) {
        const doc = {};
        for(const item of docs['@param']) {
            doc[item[0]] = item[1];
        }
        this.content += `#params参数` + returnSysbol;
        this.content += `
            | 参数名 | 说明 | 类型 | 必传 | 默认值 |
            | ------ | ---- | ----| ---- | ------ |
        `;
        for(const item of params) {
            this.content += `|${item.name}|${doc[item.name]}|${item.type}|${item.isRequire}|        |` + returnSysbol;
        }
    }
}