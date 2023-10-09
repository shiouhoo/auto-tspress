import { SourceFile, EnumDeclaration, TypeAliasDeclaration, InterfaceDeclaration } from 'ts-morph';
import { UseTypes, TypeItem, TypeValue } from '@/types';
import { collectDoc } from './collectDoc';
import { getDetailTypeByString, getMembersToTypeValue } from '../type/typeParse';
import { log } from '@/log';

const getGenerics = (interfaceDeclaration: InterfaceDeclaration | TypeAliasDeclaration)=>{
    const generics = interfaceDeclaration.getTypeParameters();
    return generics.map(item => item.getText());
};

// 收集import导入的类型
const collectImportTypes = (sourceFile: SourceFile, useTypes: UseTypes) => {

    // 保存对应的属性列表
    const globalFileTypes: Record<string, Record<string, TypeItem>> = {};

    const importDeclarations = sourceFile.getImportDeclarations();
    for (const importDeclaration of importDeclarations) {
        // 不是类型的导入
        if(!importDeclaration.getImportClause()) continue;
        // 被导入模块名
        const moduleSpecifier = importDeclaration.getModuleSpecifierValue();
        const moduleSpecifierSourceFile = importDeclaration.getModuleSpecifierSourceFile();
        if(!moduleSpecifierSourceFile) {
            log.log(`在文件${sourceFile.getBaseName()}中，没有找到导入的${moduleSpecifier}模块`);
            continue;
        }

        // 默认导入
        /** 默认导入的名称 */
        const name = importDeclaration.getImportClause()?.getSymbol()?.getEscapedName();
        if(name && [...useTypes.util, ...useTypes.hooks].some(element => element.includes(name))) {
            const t = gettypeInfosByExportName(moduleSpecifierSourceFile, name, true);
            globalFileTypes[moduleSpecifierSourceFile.getBaseName()] = {
                ...globalFileTypes[moduleSpecifierSourceFile.getBaseName()],
                [name]: t
            };
            useTypes.typeToFileMap[name] = `../globalTypes/${moduleSpecifierSourceFile.getBaseName().replace('ts', 'html').toLowerCase()}#${name.toLowerCase()}`;

        }

        // 具名导入
        for (const specifier of importDeclaration.getNamedImports()) {
            const name = specifier.getName();
            if ([...useTypes.hooks, ...useTypes.util].some(element => element.includes(name))) {
                const t = gettypeInfosByExportName(moduleSpecifierSourceFile, name, false, moduleSpecifier);
                globalFileTypes[moduleSpecifierSourceFile.getBaseName()] = {
                    ...globalFileTypes[moduleSpecifierSourceFile.getBaseName()],
                    [name]: t
                };
                useTypes.typeToFileMap[name] = `../globalTypes/${moduleSpecifierSourceFile.getBaseName().replace('ts', 'html').toLowerCase()}#${name.toLowerCase()}`;
            }
        }
        // import * as 方式
        const importText = importDeclaration.getImportClause().getText();
        if(importText.includes('* as')) {
            // 获取别名的名称
            // const aliasName = importText.match(/^\*\s+as\s+(\w+)/)[1];
            for(const item of [...useTypes.hooks, ...useTypes.util]) {
                const typeName = item.split('.')[1];
                if(!typeName) continue;
                const t = gettypeInfosByExportName(importDeclaration.getModuleSpecifierSourceFile(), typeName, false);
                globalFileTypes[moduleSpecifierSourceFile.getBaseName()] = {
                    ...globalFileTypes[moduleSpecifierSourceFile.getBaseName()],
                    [typeName]: t
                };
                useTypes.typeToFileMap[typeName] = `../globalTypes/${moduleSpecifierSourceFile.getBaseName().replace('ts', 'html').toLowerCase()}#${typeName.toLowerCase()}`;

            }
        }
    }

    return globalFileTypes;
};
// 收集文件中的interface，type，enum
const collectTypeInFile = (sourceFile: SourceFile, useTypes: UseTypes) => {
    const globalFileTypes: Record<string, TypeItem> = {};
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
            /** 记录目标类型 */
            let targetType: 'object' | 'array' | 'string' = 'object';
            /** 记录泛型信息 */
            let generics:string[];
            const name: string = object.getName();
            if (!object.isExported() && ![...useTypes.hooks, ...useTypes.util].some(element => element.includes(name))) continue;
            // 保存属性列表
            let typeObject: TypeValue | string = {};
            if (type === 'interface') {
                // 获取接口的属性列表
                typeObject = getMembersToTypeValue(<InterfaceDeclaration>object) || {};
                generics = getGenerics(<InterfaceDeclaration>object);
            } else if (type === 'type') {
                [typeObject, targetType] = getDetailTypeByString((<TypeAliasDeclaration>object).getTypeNode().getText());
                generics = getGenerics(<TypeAliasDeclaration>object);
            } else if (type === 'enum') {
                typeObject = getMembersToTypeValue(<EnumDeclaration>object);
            }
            const tmp: TypeItem = {
                value: typeObject,
                type: type === 'interface' ? 'interface' : type === 'type' ? 'type' : 'enum',
                targetType,
                generics,
                docs: collectDoc(object.getJsDocs()[0])
            };
            if (object.isExported()) {
                globalFileTypes[name] = tmp;
            }else{
                if (useTypes.hooks.has(name)) {
                    fileHooksTypes[name] = tmp;
                    useTypes.typeToFileMap[name] = `#${name.toLowerCase()}`;
                }
                if (useTypes.util.has(name)) {
                    fileUtilTypes[name] = tmp;
                    useTypes.typeToFileMap[name] = `#${name.toLowerCase()}`;
                }
            }
        }
    }

    return {
        globalFileTypes,
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
                    value: getMembersToTypeValue(namedExport) || '',
                    docs: collectDoc(namedExport.getJsDocs()[0])
                };
            }else if(namedExport instanceof EnumDeclaration) {
                return {
                    type: 'enum',
                    value: getMembersToTypeValue(namedExport) || '',
                    docs: collectDoc(namedExport.getJsDocs()[0])
                };
            }else if(exportText.includes('type')) {
                const [typeObject, targetType] = getDetailTypeByString(namedExport.getTypeNode().getText());
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

/**
 * @param sourceFile
 * @param useTypes
 * @returns {
 *      globalFileTypes : 该文件的全局类型
 *      globalTargetTypes : 该文件import的文件的全局类型
 *      fileType : 该文件的局部类型
 * }
 */
export const collectTypes = (sourceFile: SourceFile, useTypes: UseTypes): {
    globalFileTypes: Record<string, TypeItem>,
    globalTargetTypes: Record<string, Record<string, TypeItem>>
    fileType: Record<string, Record<string, TypeItem>>
} => {
    const { fileUtilTypes, fileHooksTypes, globalFileTypes } = collectTypeInFile(sourceFile, useTypes);
    const globalTargetTypes = collectImportTypes(sourceFile, useTypes);
    const fileType = {
        hooks: {
            ...fileHooksTypes,
        },
        util: {
            ...fileUtilTypes,
        }
    };
    return {
        globalTargetTypes: Object.keys(globalTargetTypes).length ? globalTargetTypes : null,
        globalFileTypes: Object.keys(globalFileTypes).length ? globalFileTypes : null,
        fileType,
    };
};
