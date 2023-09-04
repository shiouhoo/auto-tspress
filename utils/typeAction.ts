import { SourceFile, ExportedDeclarations } from 'ts-morph';
import { TypeItem } from '../types';
import { returnSysbol } from '../global';

// 判断字符串是否为基本类型
export const isBaseType = (str: string) => {
    return /^(?:string|number|boolean|undefined|null|symbol)\w?\[\]$/.test(str);
};
/** 通过字符串获取interface */
export const getInterfaceByText = (exportText: string): Record<string, string>=>{
    const match = exportText.match(/export +interface +.+\{([^}]+)\}/);
    if(!match) return null;
    const typeObjectStr = match[1].trim();
    const typeObject = {};

    typeObjectStr.split(returnSysbol).forEach(line => {
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

    typeObjectStr.split(returnSysbol).forEach(line => {
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
                    value: getInterfaceByText(exportText) || ''
                };
            }else if(/^export +enum/.test(exportText)) {
                return {
                    type: 'enum',
                    value: getEnumByText(exportText) || ''
                };
            }if(exportText.includes('type')) {
                return {
                    type: 'type',
                    value: exportText.split('=')[1]?.replace(';', '')?.trim()
                };
            }else{
                return {
                    type: '未知',
                    value: '没有解析到类型，可能来源于第三方包'
                };
            }
        } else {
            throw new Error(`${sourceFile.getFilePath()}没有导出${name}`);
        }
    }
};