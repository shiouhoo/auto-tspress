import os from 'os';
import { Params, TypeItem } from '../types';

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
        this.content = '---' + returnSysbol;
        this.content += 'outline: deep' + returnSysbol;
        this.content += '---' + returnSysbol;
    }
    // 创建标题
    createTitle(level:1|2|3|4|5|6, title:string) {
        if(!title) return;
        this.content += '#'.repeat(level) + ' ' + title + returnSysbol;
    }
    // 创建函数说明
    createText(text: string) {
        if(!text) return;
        this.content += text + returnSysbol;
    }
    // 创建参数表格
    createParamsTable(params: Params, docs: Record<string, string[][]>) {
        const doc = {};
        if(docs) {
            for(const item of docs['@param']) {
                doc[item[0]] = item[1];
            }
        }
        this.content += `### params参数` + returnSysbol;
        if(!params.length) {
            this.content += `无` + returnSysbol;
            return;
        }
        this.content += '| 参数名 | 说明 | 类型 | 必传 | 默认值 |' + returnSysbol;
        this.content += '| ------ | ---- | ----| ---- | ------ |' + returnSysbol;
        for(const item of params) {
            this.content += `|${item.name}|${doc[item.name] || ''}|${item.type}|${item.isRequire}|        |` + returnSysbol;
        }
    }
    // 创建类型表格
    createTypesTable(typeInfo: TypeItem) {
        if(!Object.keys(typeInfo.value).length) {
            this.content += `无` + returnSysbol;
            return;
        }
        this.content += '| 键名 | 说明 | 类型 | 必传 |' + returnSysbol;
        this.content += '| ------ | ---- | ----| ---- |' + returnSysbol;
        if(['interface', 'enum'].includes(typeInfo.type)) {
            for(const item in typeInfo.value as Record<string, string>) {
                this.content += `|${item}|${ ''}|${typeInfo.value[item]}||` + returnSysbol;
            }
        }
    }
}