import { TypeValue } from '@/types';
import { collectDoc } from '../collect/collectDoc';
import { InterfaceDeclaration, EnumDeclaration } from 'ts-morph';
import { splitFirstChar } from '../stringUtil';

/** 通过字符串获取类型 */
export const getTypeByText = (str: string, isDefault): string => {
    if(!Number.isNaN(Number(str))) {
        return 'number';
    }else if(str === 'true' || str === 'false') {
        return 'boolean';
    }else if(str.includes('new')) {
        const match = str.match(/new (.+?)\(/);
        return match ? match[1] : '';
    }else if(str.includes('.')) {
        if(Number.isNaN(Number(str.split('.')[isDefault ? 0 : 1]))) {
            return str.split('.')[isDefault ? 0 : 1];
        }
    }
    return str;
};

/** 获取Record中使用到的特殊类型 */
const getRecordType = (str: string) =>{
    const match = str.match(/^Record<\s*[^,]+\s*,\s*([\s\S]+)>/)?.map(str => str.trim());
    if(match) {
        return getRecordType(match[1]);
    }
    return str;
};

/** 从type字符串中获得使用过的特殊类型 */
export const getUseTypeByText = (str: string) => {
    let bracketLevel = 0;
    const paramsList = [];
    let currentArg = '';

    for (let i = 0;i < str.length;i++) {
        const char = str[i];
        if ((char === '&' || char === '|') && bracketLevel === 0) {
            paramsList.push(currentArg.trim());
            currentArg = '';
        } else {
            currentArg += char;

            if (char === '<' || char === '{') {
                bracketLevel++;
            } else if (char === '>' || char === '}') {
                bracketLevel--;
            }
        }
    }
    paramsList.push(currentArg.trim());
    const results = [];
    for(let i = 0;i < paramsList.length;i++) {
        const item = paramsList[i];
        if(item.includes('Record')) {
            paramsList.push(getRecordType(item).trim());
        }else if(/.*<.*>/.test(item)) {
            if(!isBaseType(item.match(/.*<(.*?)>/)?.[1] || '')) {
                paramsList.push(...getUseTypeByText(item.match(/.*<(.*?)>/)?.[1]));
            }
            results.push(item.replace(/(.*)<.*>/, '$1').trim());
        }else if(!isBaseType(item)) {
            results.push(item);
        }
    }
    return results;
};

// 判断字符串是否为基本类型
export const isBaseType = (str: string) => {
    return /^\w*(string|number|boolean|undefined|null|symbol)\w*$/.test(str);
};

/** 将interface，enum的信息转为对象 */
export const getMembersToTypeValue = (namedExport:InterfaceDeclaration | EnumDeclaration): TypeValue=>{
    const typeObject: TypeValue = {};
    if(namedExport instanceof InterfaceDeclaration) {
        for(const member of namedExport.getProperties()) {
            typeObject[member.getName()] = {
                value: member.getTypeNode()?.getText(),
                isRequire: !member.hasQuestionToken(),
                doc: collectDoc(member.getJsDocs()[0])
            };
        }
        // 获取索引签名
        const indexSignature = namedExport.getIndexSignatures()[0];
        if(indexSignature) {
            typeObject[`[${indexSignature.getKeyName()} as ${indexSignature.getType().getText()}]`] = {
                value: indexSignature.getReturnType().getText(),
                isRequire: false,
                doc: collectDoc(indexSignature.getJsDocs()[0])
            };
        }
    }else if(namedExport instanceof EnumDeclaration) {
        for(const member of namedExport.getMembers()) {
            typeObject[member.getName()] = {
                value: member.getValue() + '',
                isRequire: true,
                doc: collectDoc(member.getJsDocs()[0])
            };
        }
    }
    return Object.keys(typeObject).length ? typeObject : null;
};
/** 将type的信息转为对象 */
export const getDetailTypeByString = (str:string): [TypeValue | string, 'array'|'object'|'string']=>{
    let targetType;
    const typeObject: TypeValue = {};
    if((str = str.trim()).startsWith('Record')) {
        targetType = 'Record';
        const match = str.match(/^Record<\s*([^,]+)\s*,\s*([\s\S]+)>/)?.map(str => str.trim());
        if(match) {
            typeObject[match[1]] = {
                value: match[2],
                isRequire: null,
                doc: null
            };
        }
        return [typeObject, targetType];
    }else if(str.match(/\{([\s\S]+)\}\[\]$/)) {
        targetType = 'array';
    }else if(str.match(/\{([\s\S]+)\}$/)) {
        targetType = 'object';
    }else{
        return [str, 'string'];
    }
    // 配置doc和第二行的键值对
    let bracketLevel = 0;
    str = str.match(/\{([\s\S]*)\}/)[1].replaceAll('\r\n', '\n').trim();
    for(let i = 0;i < str.length;i++) {
        let [comment, keyValue] = ['', ''];
        let char = str[i];
        if(char === ' ') continue;
        // 匹配注释
        if(char === '/' && str[i + 1] === '*' && str[i + 2] === '*') {
            const idx = str.indexOf('*/', i);
            comment = str.slice(i + 3, idx).trim();
            i = idx + 3;
        }else if(char === '/' && str[i + 1] === '/') {
            const idx = str.indexOf('\n', i);
            comment = str.slice(i + 2, idx).trim();
            i = idx + 2;
        }
        // 匹配键值
        do{
            char = str[i];
            keyValue += char;
            if (char === '<' || char === '{') {
                bracketLevel++;
            } else if (char === '>' || char === '}') {
                bracketLevel--;
            }
            i++;
        }while(i < str.length && (char !== '\n' || bracketLevel !== 0));
        const [key, value] = splitFirstChar(keyValue, ':').map(str => str.replace(/[,;]\s*$/, '').trim());
        const isRequire = !key.includes('?');
        typeObject[isRequire ? key : key.replace('?', '')] = {
            value: value,
            isRequire,
            doc: comment && {
                comment: [[comment.replace(/^\s*\**(.*?)\**\s*$/g, '$1').trim() || '']]
            }
        };
    }

    return [typeObject, targetType];

};