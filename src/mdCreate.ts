import { lineSysbol } from './global';
import { Params, TypeItem, TypeValue } from './types';
import { objectToString, escapeSpecialChars } from './utils/stringUtil';
import { log } from './log';

export class MdCreator {
    header: string;
    content: string;
    setup: string;
    index: number;
    useTypesFileMap: Record<string, string>;
    constructor(useTypesFileMap: Record<string, string>) {
        this.useTypesFileMap = useTypesFileMap;
        this.header = '---' + lineSysbol;
        this.header += 'outline: [1,2,3]' + lineSysbol;
        this.header += '---' + lineSysbol;
        this.content = '';
        this.setup = '';
        this.index = 1;
    }
    getContent() {
        let str = this.header;
        if(this.setup) {
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
    createTitle(level:1|2|3|4|5|6, title:string, isLog = true) {
        if(!title) return;
        isLog && log.logCollect('创建了一个标题：' + title);
        this.content += '#'.repeat(level) + ' ' + title + lineSysbol;
    }
    // 创建文本
    createText(text: string, tag?: string) {
        if(!text) return;
        log.logCollect('创建了一段文本：' + text);
        if(tag) {
            this.content += `- ${tag}: `;
        }
        this.content += escapeSpecialChars(text) + '<br />' + lineSysbol;
    }
    // 创建代码块
    createDescText(text: string | string[], { tag, light = 'all', joinChar = ', ' }: { tag?: string, light?:boolean[] | 'all', joinChar?:string }) {
        if(typeof text === 'string') {
            text = [text];
        }
        if(tag) {
            this.content += `- ${tag}: `;
        }
        for(let i = 0;i < text.length;i++) {
            if(light === 'all' || (light && light[i])) {
                this.content += `\`${escapeSpecialChars(text[i])}\``;
            }else{
                this.content += escapeSpecialChars(text[i]);
            }
            if(i !== text.length - 1) {
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
        log.logCollect('创建了一个文件说明：' + JSON.stringify(doc, null, 2));
        if(!doc) return;
        if(doc['@description']) {
            this.content += `- 描述：${escapeSpecialChars(doc['@description'])}` + lineSysbol;
        }
        if(doc['@author']) {
            this.content += `- 作者：${escapeSpecialChars(doc['@author'])}` + lineSysbol;
        }
        if(doc['@date']) {
            this.content += `- 更新日期：${escapeSpecialChars(doc['@date'])}` + lineSysbol;
        }
    }
    // 创建返回类型
    createReturns(text: string, type: 'type' | 'describe') {
        const typeText = type === 'type' ? '返回类型' : '描述';
        log.logCollect(`创建了${typeText}：` + text);
        text = escapeSpecialChars(text);
        if(type === 'type') {
            for(const typeName in this.useTypesFileMap) {
                if(text.includes(typeName)) {
                    text = text.replaceAll(typeName, `<a href="${this.useTypesFileMap[typeName]}">${typeName}</a>`);
                }
            }
        }
        this.content += `- ${typeText}: ${text}` + lineSysbol;
    }
    // 创建参数表格
    createParamsTable(params: Params, docs: Record<string, string[][]>) {
        const doc = {};
        if(docs) {
            for(const item of docs['@param'] || []) {
                doc[item[0]] = item.slice(1, item.length).join(' ').replace(/^[- ]+/g, '');
            }
        }
        log.logCollect('创建了一个参数表格：' + JSON.stringify(params, null, 2), 'doc依赖：' + JSON.stringify(doc, null, 2));
        this.content += `#### params参数` + lineSysbol;
        if(!params || !params.length) {
            this.content += `无` + lineSysbol;
            return;
        }
        const props = [];
        for(const item of params) {
            for(const typeName in this.useTypesFileMap) {
                if(item.type.includes(typeName)) {
                    item.type = item.type.replaceAll(typeName, `<a href="${this.useTypesFileMap[typeName]}">${typeName}</a>`);
                }
            }
            props.push({
                name: item.name,
                describe: doc[item.name] || '-',
                type: item.type || 'any',
                isRequire: item.isRequire,
                defaultValue: !item.isRequire ? item.defaultValue : '-',
            });
        }
        this.createSetup(`const tableData${this.index}=${objectToString(props)}`);
        this.content += `<ParamsTable :tableData='tableData${this.index}'></ParamsTable>` + lineSysbol;
        this.index++;
    }
    // 创建类型表格
    createTypesTable(typeInfo: TypeItem) {
        if((typeof typeInfo.value == 'string' && !typeInfo.value.length) || !Object.keys(typeInfo.value).length) {
            this.content += `无` + lineSysbol;
            return;
        }
        log.logCollect('创建了一个类型表格：' + JSON.stringify(typeInfo, null, 2));
        const props = [];
        const typeShouldTable = typeInfo.type === 'type' && ['object', 'array'].includes(typeInfo.targetType);
        if(['interface', 'enum'].includes(typeInfo.type) || typeShouldTable) {
            for(const item in typeInfo.value as TypeValue) {
                props.push({
                    name: item,
                    describe: typeInfo.value[item].doc?.['@description']?.[0]?.[0] || typeInfo.value[item].doc?.['comment']?.[0]?.[0] || '-',
                    type: typeInfo.value[item].value,
                    isRequire: typeInfo.value[item].isRequire,
                });
            }
            this.createSetup(`const tableData${this.index}=${objectToString(props)}`);

            // type详情说明
            if(typeInfo.type === 'type') {
                let typeText:string;
                switch(typeInfo.targetType) {
                case 'object':
                    typeText = '`对象`，属性如下：';
                    break;
                case 'array':
                    typeText = '`数组`，每项属性如下：';
                    break;
                case 'string':
                    typeText = '`string`，属性如下：';
                    break;
                default:
                    typeText = '其他';
                }
                this.content += `- 类型: ${typeText}` + lineSysbol;
            }
            this.content += `<TypeTable :tableData='tableData${this.index}' type='${typeInfo.type}'></TypeTable>` + lineSysbol;
            this.index++;
        }else if(typeInfo.type === 'type') {
            this.content += `- 类型：\`${typeInfo.value}\`` + lineSysbol;
        }
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