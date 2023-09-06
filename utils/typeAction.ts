import { SourceFile, ExportedDeclarations } from 'ts-morph';
import { TypeItem } from '../types';
import { lineSysbol } from '../global';

// 判断字符串是否为基本类型
export const isBaseType = (str: string) => {
    return /^(?:string|number|boolean|undefined|null|symbol)\w?\[\]$/.test(str);
};
/** 通过字符串获取类型 */
export const getTypeByText = (str: string): string => {
    if(!Number.isNaN(Number(str))) {
        return 'number';
    }else if(str === 'true' || str === 'false') {
        return 'boolean';
    }else if(['null', 'undefined'].includes(str)) {
        return str;
    }else if(str.includes('new')) {
        const match = str.match(/new (.+?)\(/);
        return match[1];
    }else if(str.includes('.')) {
        if(Number.isNaN(Number(str.split('.')[0]))) {
            return str.split('.')[0];
        }else{
            return 'string';
        }
    }
    return 'string';
};
/** 对象转字符串 */
export const objectToString = (obj) => {
    if (Array.isArray(obj)) {
        // 如果是数组，递归处理数组元素
        const elements = obj.map(element => objectToString(element));
        return `[${elements.join(',')}]`;
    } else if (typeof obj === 'object') {
        if (obj instanceof Date) {
            // 如果是 Date 对象，返回日期的字符串表示
            return obj.toISOString();
        } else {
        // 如果是对象，则递归处理其属性
            const keys = Object.keys(obj);
            const pairs = [];

            for (const key of keys) {
                const value = objectToString(obj[key]);
                pairs.push(`${key}:${value}`);
            }

            return `{${pairs.join(',')}}`;
        }
    } else {
        // 如果是基本数据类型或函数，则使用字符串化的值
        return JSON.stringify(obj);
    }
};
/** 通过字符串获取interface */
export const getInterfaceByText = (exportText: string): Record<string, string>=>{
    const match = exportText.match(/export +interface +.+\{([^}]+)\}/);
    if(!match) return null;
    const typeObjectStr = match[1].trim();
    const typeObject = {};

    typeObjectStr.split(lineSysbol).forEach(line => {
        const [key, value] = line.replace(',', '').split(':').map(part => part.trim());
        typeObject[key] = value;
    });
    return typeObject;
};
/** 通过字符串获取enum */
export const getEnumByText = (exportText: string): Record<string, string>=>{
    const match = exportText.match(/export +enum +.+\{([^}]+)\}/);
    if(!match) return null;
    const typeObjectStr = match[1].trim();
    const typeObject = {};

    typeObjectStr.split(lineSysbol).forEach(line => {
        const [key, value] = line.replace(',', '').split('=').map(part => part.trim());
        typeObject[key] = value;
    });
    return typeObject;
};
/** 通过文件以及变量名获取导出的类型信息 */
export const gettypeInfosByExportName = (sourceFile: SourceFile, name:string, isDefault = false): TypeItem=> {

    if(isDefault) {
        const defaultExport = sourceFile.getDefaultExportSymbol();

        if (!defaultExport) {
            throw new Error(`${sourceFile.getFilePath()}没有默认导出`);
        }

    }else{
        const exportedDeclarations = sourceFile.getExportedDeclarations();
        // 查找具名导出并获取名称
        let namedExport: ExportedDeclarations = null;
        for (const [exportName, declarations] of exportedDeclarations.entries()) {
            if (exportName === name) {
                // 遍历具名导出的声明并获取其名称
                namedExport = declarations[0];
            }
        }
        if (namedExport) {
            const exportText = namedExport.getText();
            if(/^export +interface/.test(exportText)) {
                return {
                    type: 'interface',
                    value: getInterfaceByText(exportText) || '',
                    docs: null
                };
            }else if(/^export +enum/.test(exportText)) {
                return {
                    type: 'enum',
                    value: getEnumByText(exportText) || '',
                    docs: null
                };
            }if(exportText.includes('type')) {
                return {
                    type: 'type',
                    value: exportText.split('=')[1]?.replace(';', '')?.trim(),
                    docs: null
                };
            }else{
                return {
                    type: '未知',
                    value: '没有解析到类型，可能来源于第三方包',
                    docs: null
                };
            }
        } else {
            throw new Error(`${sourceFile.getFilePath()}没有导出${name}`);
        }
    }
};