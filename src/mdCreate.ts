import { lineSysbol } from './global';
import { Params, Returns, TypeDeclaration } from './types';
import { objectToString, escapeSpecialChars } from './utils/stringUtil';
import { log } from './log';

export class MdCreator {
    header: string;
    content: string;
    setup: string;
    index: number;
    constructor() {
        this.header = '---' + lineSysbol;
        this.header += 'outline: [2, 3]' + lineSysbol;
        this.header += '---' + lineSysbol;
        this.content = '';
        this.setup = '';
        this.index = 1;
    }
    getContent() {
        let str = this.header;
        if (this.setup) {
            str += `<script setup>` + lineSysbol;
            str += this.setup;
            str += `</script>` + lineSysbol;
        }
        str += this.content;
        return str;
    }
    createSetup(str: string) {
        this.setup += str + lineSysbol;
    }
    // 创建标题
    createTitle(level: 1 | 2 | 3 | 4 | 5 | 6, title: string, isLog = true) {
        if (!title) return;
        isLog && log.logDebug('创建了一个标题：' + title);
        this.content += '#'.repeat(level) + ' ' + title + lineSysbol;
    }
    // 创建文本
    createText(text: string, tag?: string) {
        if (!text) return;
        log.logDebug('创建了一段文本：' + text);
        if (tag) {
            this.content += `- ${tag}: `;
        }
        this.content += escapeSpecialChars(text) + '<br />' + lineSysbol;
    }
    // 创建代码块
    createDescText(text: string | string[], { tag, light = 'all', joinChar = ', ' }: { tag?: string, light?: boolean[] | 'all', joinChar?: string }) {
        if (typeof text === 'string') {
            text = [text];
        }
        if (tag) {
            this.content += `- ${tag}: `;
        }
        for (let i = 0;i < text.length;i++) {
            if (light === 'all' || (light && light[i])) {
                this.content += `\`${escapeSpecialChars(text[i])}\``;
            } else {
                this.content += escapeSpecialChars(text[i]);
            }
            if (i !== text.length - 1) {
                this.content += joinChar;
            }
        }
        this.content += '<br />' + lineSysbol;
    }
    // 创建ts代码块
    createTsCode(code: string) {
        this.content += '```ts' + lineSysbol;
        this.content += code + lineSysbol;
        this.content += '```' + lineSysbol;
    }
    // 创建文件说明
    createFileDoc(doc: Record<string, string>) {
        log.logDebug('创建了一个文件说明：' + JSON.stringify(doc, null, 2));
        if (!doc) return;
        if (doc['@description']) {
            this.content += `- 描述：${escapeSpecialChars(doc['@description'])}` + lineSysbol;
        }
        if (doc['@author']) {
            this.content += `- 作者：${escapeSpecialChars(doc['@author'])}` + lineSysbol;
        }
        if (doc['@date']) {
            this.content += `- 更新日期：${escapeSpecialChars(doc['@date'])}` + lineSysbol;
        }
    }
    // 创建返回类型
    createReturns(type: Returns, linkList:{name:string, path:string}[]) {
        const typeText = '返回类型';
        log.logDebug(`创建了${typeText}：` + type.value);
        let value = escapeSpecialChars(type.value);
        for (const linkItem of linkList || []) {
            value = value.replaceAll(linkItem.name, `<a href="${linkItem.path}">${linkItem.name}</a>`);
        }
        this.content += `- ${typeText}: ${value || 'void'}` + lineSysbol;
    }
    // 创建参数表格
    createParamsTable(params: Params[], linkList:{name:string, path:string}[], docs: Record<string, string[][]>) {
        const doc = {};
        if (docs) {
            for (const item of docs['@param'] || []) {
                doc[item[0]] = item.slice(1, item.length).join(' ').replace(/^[- ]+/g, '');
            }
        }

        log.logDebug('创建了一个参数表格：' + JSON.stringify(params, null, 2), 'doc依赖：' + JSON.stringify(doc, null, 2));
        this.content += `#### params参数` + lineSysbol;
        if (!params || !params.length) {
            this.content += `无` + lineSysbol;
            return;
        }
        const props = [];
        for (const item of params) {
            let typeValue: string = item.type;
            for (const linkItem of linkList || []) {
                typeValue = typeValue.replaceAll(linkItem.name, `<a href="${linkItem.path}">${linkItem.name}</a>`);
            }
            props.push({
                name: item.name,
                describe: doc[item.name] || '--',
                type: typeValue || 'any',
                isRequire: item.isRequire,
                defaultValue: !item.isRequire ? item.defaultValue : '--',
            });
        }
        this.createSetup(`const tableData${this.index}=${objectToString(props)}`);
        this.content += `<ParamsTable :tableData='tableData${this.index}'></ParamsTable>` + lineSysbol;
        this.index++;
    }
    // 创建类型表格
    createTypesTable(typeInfo: TypeDeclaration) {
        if ((typeof typeInfo.value == 'string' && !typeInfo.value.length) || !Object.keys(typeInfo.value).length) {
            this.content += `无` + lineSysbol;
            return;
        }
        log.logDebug('创建了一个类型表格：' + JSON.stringify(typeInfo, null, 2));
        const props = [];
        let tableData;
        if ('interface' === typeInfo.type) {
            tableData = typeInfo.interfaceDetail;
        }

        for (const item in tableData) {
            props.push({
                name: item,
                describe: tableData[item].doc?.['@description']?.[0]?.[0] || tableData[item].doc?.['comment']?.[0]?.[0] || '--',
                type: tableData[item]?.value || '--',
                isIndexSignature: tableData[item]?.isIndexSignature,
                isRequire: tableData[item].isRequire,
            });
        }
        this.createSetup(`const tableData${this.index}=${objectToString(props)}`);

        // type详情说明
        // if (typeInfo.type === 'type') {
        //     let typeText: string;
        //     switch (typeInfo.type) {
        //     case 'object':
        //         typeText = '`对象`，属性如下：';
        //         break;
        //     case 'array':
        //         typeText = '`数组`，每项属性如下：';
        //         break;
        //     case 'string':
        //         typeText = '`string`，属性如下：';
        //         break;
        //     default:
        //         typeText = '其他';
        //     }
        //     this.content += `- 类型: ${typeText}` + lineSysbol;
        // }
        this.content += `<TypeTable :tableData='tableData${this.index}' type='${typeInfo.type}'></TypeTable>` + lineSysbol;
        this.index++;
    }
    // 创建锚点跳转
    createLinkNext() {
        this.createSetup(`
setTimeout(()=>{
    const dom = document.querySelector(\`a[href="\${location.hash}"]\`)
    dom && dom.click();
})
        `);
    }
}