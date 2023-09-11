import { lineSysbol } from '../global';
import { Params, TypeItem, TypeValue } from '../types';
import { objectToString } from './typeAction';

export class MdCreator {
    header: string;
    content: string;
    setup: string;
    index: number;
    constructor() {
        this.header = '---' + lineSysbol;
        this.header += 'outline: deep' + lineSysbol;
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
    createTitle(level:1|2|3|4|5|6, title:string) {
        if(!title) return;
        this.content += '#'.repeat(level) + ' ' + title + lineSysbol;
    }
    // 创建函数说明
    createText(text: string) {
        if(!text) return;
        this.content += text + '<br />' + lineSysbol;
    }
    // 创建ts代码块
    createTsCode(code: string) {
        this.content += '```ts' + lineSysbol;
        this.content += code + lineSysbol;
        this.content += '```' + lineSysbol;
    }
    // 创建文件说明
    createFileDoc(doc: Record<string, string>) {
        if(!doc) return;
        if(doc['@description']) {
            this.content += `- 描述：${doc['@description']}` + lineSysbol;
        }
        if(doc['@author']) {
            this.content += `- 作者：${doc['@author']}` + lineSysbol;
        }
        if(doc['@date']) {

            this.content += `- 更新日期：${doc['@date']}` + lineSysbol;
        }
    }
    // 创建参数表格
    createParamsTable(params: Params, docs: Record<string, string[][]>) {
        const doc = {};
        if(docs) {
            for(const item of docs['@param'] || []) {
                doc[item[0]] = item.slice(1, item.length).join('').replace(/[- ]+/g, '');
            }
        }
        this.content += `#### params参数` + lineSysbol;
        if(!params || !params.length) {
            this.content += `无` + lineSysbol;
            return;
        }

        const props = [];
        for(const item of params) {
            props.push({
                name: item.name,
                describe: doc[item.name] || '-',
                type: item.type,
                isRequire: item.isRequire,
                defaultValue: !item.isRequire ? item.defaultValue : '-'
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
        const props = [];
        const typeShouldTable = typeInfo.type === 'type' && ['object', 'array'].includes(typeInfo.targetType);
        if(['interface', 'enum'].includes(typeInfo.type) || typeShouldTable) {
            for(const item in typeInfo.value as TypeValue) {
                props.push({
                    name: item,
                    describe: typeInfo.value[item].doc?.['@description']?.[0]?.[0] || typeInfo.value[item].doc?.['comment']?.[0]?.[0] || '-',
                    type: typeInfo.value[item].value,
                    isRequire: '-',
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
}