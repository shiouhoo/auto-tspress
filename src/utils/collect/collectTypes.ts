import { SourceFile, Project, EnumDeclaration, TypeAliasDeclaration, InterfaceDeclaration } from 'ts-morph';
import { UseTypes, TypeItem, TypeValue } from '@/types';
import { setting } from '@/global';
import { collectDoc } from './collectDoc';
import { getDetailTypeByString, parseTypeImport, getDetailByExport } from '../type/typeParse';

// 收集import导入的类型
const collectImportTypes = (sourceFile: SourceFile, useTypes: UseTypes) => {

    // 保存对应的属性列表
    const fileImportsUtil: Record<string, TypeItem> = {};
    const fileImportsHooks: Record<string, TypeItem> = {};

    const importDeclarations = sourceFile.getImportDeclarations();
    for (const importDeclaration of importDeclarations) {
        // 不是类型的导入
        if(!importDeclaration.getImportClause()) continue;
        // 被导入模块名
        const moduleSpecifier = importDeclaration.getModuleSpecifierValue();
        let moduleSpecifierSourceFile = importDeclaration.getModuleSpecifierSourceFile();
        if(!moduleSpecifierSourceFile) {
            throw new Error(`在文件${sourceFile.getBaseName()}中，没有找到导入的${moduleSpecifier}模块`);
        }
        // 检查是否以@开头
        if (moduleSpecifier.startsWith('@')) {
            // 将@替换为实际路径
            const actualPath = moduleSpecifier.replace('@', setting['@']);
            moduleSpecifierSourceFile ||= new Project().getSourceFile(actualPath);
        }
        if(!moduleSpecifierSourceFile) continue;
        // 默认导入
        /** 默认导入的名称 */
        const name = importDeclaration.getImportClause()?.getSymbol()?.getEscapedName();
        if (name && [...useTypes.util, ...useTypes.hooks].some(element => element.includes(name))) {
            const t = gettypeInfosByExportName(moduleSpecifierSourceFile, name, true);
            if (useTypes.hooks.has(name)) {
                fileImportsHooks[name] = t;
                // useTypes.hooks.delete(name);
            }
            if (useTypes.util.has(name)) {
                fileImportsUtil[name] = t;
                // useTypes.util.delete(name);
            }
        }
        // 具名导入
        for (const specifier of importDeclaration.getNamedImports()) {
            const name = specifier.getName();
            if ([...useTypes.hooks, ...useTypes.util].some(element => element.includes(name))) {
                const t = gettypeInfosByExportName(moduleSpecifierSourceFile, name, false, moduleSpecifier);
                if (useTypes.hooks.has(name)) {
                    fileImportsHooks[name] = t;
                    // useTypes.hooks.delete(name);
                }
                if (useTypes.util.has(name)) {
                    fileImportsUtil[name] = t;
                    // useTypes.util.delete(name);
                }
            }
        }
        // import * as 方式
        const importText = importDeclaration.getImportClause().getText();
        if(importText.includes('* as')) {
            // 获取别名的名称
            const aliasName = importText.match(/^\*\s+as\s+(\w+)/)[1];
            for(const item of [...useTypes.hooks, ...useTypes.util]) {
                if(!item.includes(`${aliasName}.`)) continue;
                const typeName = item.split('.')[1];
                const t = gettypeInfosByExportName(importDeclaration.getModuleSpecifierSourceFile(), typeName, false);
                if (useTypes.hooks.has(item)) {
                    fileImportsHooks[typeName] = t;
                }
                if (useTypes.util.has(item)) {
                    fileImportsUtil[typeName] = t;
                }
            }
        }
    }

    return {
        fileImportsHooks,
        fileImportsUtil
    };
};
// 收集文件中的interface，type，enum
const collectTypeInFile = (sourceFile: SourceFile, useTypes: UseTypes) => {
    const globalTypes: Record<string, TypeItem> = {};
    const fileHooksTypes: Record<string, TypeItem> = {};
    const fileUtilTypes: Record<string, TypeItem> = {};
    for (const type of ['type', 'interface', 'enum']) {
        let objects: InterfaceDeclaration[] | TypeAliasDeclaration[] | EnumDeclaration[];
        if (type === 'interface') {
            objects = sourceFile.getInterfaces();
        } else if (type === 'type') {
            objects = sourceFile.getTypeAliases();
        } else if (type === 'enum') {
            objects = sourceFile.getEnums();
        }
        for (const object of objects) {
            let targetType: 'object' | 'array' | 'string' = 'object';
            const name: string = object.getName();
            if (!object.isExported() && ![...useTypes.hooks, ...useTypes.util].some(element => element.includes(name))) break;
            // 保存属性列表
            let typeObject: TypeValue | string = {};
            if (type === 'interface') {
                // 获取接口的属性列表
                const properties = (<InterfaceDeclaration>object).getProperties();
                for (const property of properties) {
                    typeObject[property.getName()] = {
                        value: parseTypeImport(property.getType().getText(), sourceFile.getFilePath()),
                        doc: collectDoc(property.getJsDocs()[0])
                    };
                }
                // 获取索引签名
                const indexSignature = (<InterfaceDeclaration>object).getIndexSignatures()[0];
                if(indexSignature) {
                    typeObject[`[${indexSignature.getKeyName()} as ${indexSignature.getType().getText()}]`] = {
                        value: indexSignature.getReturnType().getText(),
                        doc: collectDoc(indexSignature.getJsDocs()[0])
                    };
                }
            } else if (type === 'type') {
                [typeObject, targetType] = getDetailTypeByString(object.getText().split(/type.*?=/)[1]);
            } else if (type === 'enum') {
                for (const item of (<EnumDeclaration>object).getMembers()) {
                    typeObject[item.getName()] = {
                        value: item.getValue() + '',
                        doc: collectDoc(item.getJsDocs()[0])
                    };
                }
            }
            const tmp: TypeItem = {
                value: typeObject,
                type: type === 'interface' ? 'interface' : type === 'type' ? 'type' : 'enum',
                targetType,
                docs: collectDoc(object.getJsDocs()[0])
            };
            if (object.isExported()) {
                globalTypes[name] = tmp;
            }
            if (useTypes.hooks.has(name)) {
                fileHooksTypes[name] = tmp;
            }
            if (useTypes.util.has(name)) {
                fileUtilTypes[name] = tmp;
            }
        }
    }

    return {
        globalTypes,
        fileHooksTypes,
        fileUtilTypes
    };

};

/** 通过文件以及变量名获取导出的类型信息 */
const gettypeInfosByExportName = (sourceFile: SourceFile, name:string, isDefault = false, moduleName?:string): TypeItem=> {
    // 第三方库
    if(sourceFile.getFilePath().includes('node_modules')) {
        return {
            type: '未知',
            value: '',
            docs: null,
            moduleName,
        };
    }
    if(isDefault) {
        // 找到默认导出的类型名，然后使用调用自身找出类型信息
        const defaultExport = sourceFile.getDefaultExportSymbol();
        if (!defaultExport) {
            throw new Error(`${sourceFile.getFilePath()}没有默认导出`);
        }
        // 格式为 import("C:/Users/29729/XX").XX
        const defaultExportType = defaultExport.getDeclaredType().getText();
        const realName = defaultExportType.replace(/import(.*?)[.]/, '').trim();
        if(realName === 'any') {
            throw new Error(`${sourceFile.getFilePath()}默认变量不存在`);
        }
        return gettypeInfosByExportName(sourceFile, realName, false);
    }else{
        const exportedDeclarations = sourceFile.getExportedDeclarations();
        // 查找具名导出并获取名称,ExportedDeclarations
        let namedExport = null;
        for (const [exportName, declarations] of exportedDeclarations.entries()) {
            if (exportName === name) {
                // 遍历具名导出的声明并获取其名称
                namedExport = declarations[0];
            }
        }
        if (namedExport) {
            const exportText = namedExport.getText();
            if(namedExport instanceof InterfaceDeclaration) {
                return {
                    type: 'interface',
                    value: getDetailByExport(namedExport) || '',
                    docs: collectDoc(namedExport.getJsDocs()[0])
                };
            }else if(namedExport instanceof EnumDeclaration) {
                return {
                    type: 'enum',
                    value: getDetailByExport(namedExport) || '',
                    docs: collectDoc(namedExport.getJsDocs()[0])
                };
            }else if(exportText.includes('type')) {
                const [typeObject, targetType] = getDetailTypeByString(exportText.split('=')[1]?.replace(';', '')?.trim());
                return {
                    type: 'type',
                    value: typeObject,
                    targetType,
                    docs: collectDoc(namedExport.getJsDocs()[0])
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

// 收集文件中的类型,键值为类型名
export const collectTypes = (sourceFile: SourceFile, useTypes: UseTypes): {
    globalType: Record<string, TypeItem>,
    fileType: Record<string, Record<string, TypeItem>>
} => {
    const { fileUtilTypes, fileHooksTypes, globalTypes } = collectTypeInFile(sourceFile, useTypes);
    const {
        fileImportsHooks,
        fileImportsUtil
    } = collectImportTypes(sourceFile, useTypes);
    const fileType = {
        hooks: {
            ...fileHooksTypes,
            ...fileImportsHooks
        },
        util: {
            ...fileUtilTypes,
            ...fileImportsUtil
        }
    };
    return {
        globalType: Object.keys(globalTypes).length ? globalTypes : null,
        fileType,
    };
};
