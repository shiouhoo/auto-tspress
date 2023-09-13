import { TypeValue } from '@/types';
import { cliPath, lineSysbol } from '@/global';
import { collectDoc } from '../collect/collectDoc';
import { InterfaceDeclaration, EnumDeclaration } from 'ts-morph';
import path from 'path';

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
/** 解析获取的类型为import() */
export const parseTypeImport = (str: string, sourceFilePath:string) => {
    if((str = str.trim()).includes('import(')) {
        const match = str.match(/import\("(.*?)"\)[.](.+)/)?.map(str => str.trim());
        if(!match) return str;
        if(path.join(match[1]).toString() + '.ts' === path.join(sourceFilePath).toString()) {
            return str.replace(`import("${match[1]}").`, '');
        }else{
            return str.replace(cliPath, '');
        }
    }
    return str;
};
// 判断字符串是否为基本类型
export const isBaseType = (str: string) => {
    return /^(?:string|number|boolean|undefined|null|symbol)\w?\[\]$/.test(str);
};

/** 将interface，enum的信息转为对象 */
export const getDetailByExport = (namedExport:InterfaceDeclaration | EnumDeclaration): TypeValue=>{
    const typeObject: TypeValue = {};
    if(namedExport instanceof InterfaceDeclaration) {
        for(const member of namedExport.getProperties()) {
            typeObject[member.getName()] = {
                value: member.getTypeNode()?.getText(),
                doc: collectDoc(member.getJsDocs()[0])
            };
        }
    }else if(namedExport instanceof EnumDeclaration) {
        for(const member of namedExport.getMembers()) {
            typeObject[member.getName()] = {
                value: member.getValue() + '',
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
    const keyValuePairs = str.match(/(\/\*\*([\s\S]*?)\*\/|\/\/(.*?))?\s*(\w+):\s*([^\n]+)\s*/g);
    for(const pair of keyValuePairs || []) {
        let [comment, keyValue] = ['', ''];
        if(pair.includes('/**') || pair.includes('//')) {
            [comment, keyValue] = pair.split(lineSysbol);
        }else{
            keyValue = pair;
        }
        const [key, value] = keyValue.split(':').map(str => str.replace(/,\s*$/, '').trim());
        typeObject[key] = {
            value: value,
            doc: comment && {
                comment: [[comment.replaceAll('*', '').replaceAll('/', '').trim() || '']]
            }
        };
    }

    return [typeObject, targetType];

};