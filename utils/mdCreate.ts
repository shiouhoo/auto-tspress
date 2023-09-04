import { returnSysbol } from '../global';
import { Params, TypeItem } from '../types';
import { objectToString } from './typeAction';

export class MdCreator {
    header: string;
    content: string;
    setup: string;
    index: number;
    constructor() {
        this.header = '---' + returnSysbol;
        this.header += 'outline: deep' + returnSysbol;
        this.header += '---' + returnSysbol;
        this.content = '';
        this.setup = '';
        this.index = 1;
    }
    getContent() {
        let str = this.header;
        if(this.setup) {
            str += `<script setup>` + returnSysbol;
            str += this.setup;
            str += `</script>` + returnSysbol;
        }
        str += this.content;
        return str;
    }
    createSetup(str: string) {
        this.setup += str + returnSysbol;
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
        this.content += `#### params参数` + returnSysbol;
        if(!params.length) {
            this.content += `无` + returnSysbol;
            return;
        }

        const props = [];
        for(const item of params) {
            props.push({
                name: item.name,
                describe: doc[item.name] || '-',
                type: item.type,
                isRequire: item.isRequire,
                defaultValue: item.isRequire ? item.defaultValue : '-'
            });
        }
        this.createSetup(`const tableData${this.index}=${objectToString(props)}`);
        this.content += `<ParamsTable :tableData='tableData${this.index}'></ParamsTable>` + returnSysbol;
        this.index++;
    }
    // 创建类型表格
    createTypesTable(typeInfo: TypeItem) {
        if((typeof typeInfo.value == 'string' && !typeInfo.value.length) || !Object.keys(typeInfo.value).length) {
            this.content += `无` + returnSysbol;
            return;
        }
        const props = [];
        if(['interface', 'enum'].includes(typeInfo.type)) {
            for(const item in typeInfo.value as Record<string, string>) {
                props.push({
                    name: item,
                    describe: '-',
                    type: typeInfo.value[item],
                    isRequire: '-',
                });
            }
            this.createSetup(`const tableData${this.index}=${objectToString(props)}`);
            this.content += `<TypeTable :tableData='tableData${this.index}'></TypeTable>` + returnSysbol;
            this.index++;
        }else if(typeInfo.type === 'type') {
            this.content += `${typeInfo.value}` + returnSysbol;
        }
    }
}