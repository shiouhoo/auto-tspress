import { SourceFile, ExportedDeclarations } from 'ts-morph';
import { TypeItem } from '../types';

// 判断字符串是否为基本类型
export const isBaseType = (str: string) => {
    return /^(?:string|number|boolean|undefined|null|symbol)\w?\[\]$/.test(str);
};
/** 通过字符串获取interface */
export const getInterfaceByText = (exportText: string): Record<string, string>=>{
    const match = exportText.match(/export\s+interface\s+.+\{([^}]+)\}/);
    const typeObjectStr = match[1].trim();
    const typeObject = {};

    typeObjectStr.split('\n').forEach(line => {
        const [key, value] = line.split(':').map(part => part.trim());
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
            // TODO enum，type
            if(exportText.includes('interface')) {
                return {
                    type: 'interface',
                    value: getInterfaceByText(exportText)
                };
            }
        } else {
            throw new Error(`${sourceFile.getFilePath()}没有导出${name}`);
        }
    }
};