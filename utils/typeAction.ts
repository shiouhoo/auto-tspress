import { Project } from 'ts-morph';

// 判断字符串是否为基本类型
export const isBaseType = (str: string) => {
    return /^(?:string|number|boolean|undefined|null|symbol)\w?\[\]$/.test(str);
};
/** 通过文件以及变量名获取类型信息 */
export const gettypeInfosByExportName = (file:string, name:string, isDefault = false)=>{

    const project = new Project();
    const sourceFile = project.addSourceFileAtPath(file);

    if(isDefault) {
        const defaultExport = sourceFile.getDefaultExportSymbol();

        if (defaultExport) {
            throw new Error(`暂不支持默认到处解析`);
        }else{
            throw new Error(`${file}没有默认导出${name}`);
        }

    }
};