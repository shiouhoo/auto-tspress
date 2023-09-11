import { FunctionMap, Params, Returns, CollectMap, TypeItem, TypeValue, UseTypes } from './../types/index';
import { Project, VariableStatement, FunctionDeclaration, JSDoc, SourceFile, EnumDeclaration, TypeAliasDeclaration, InterfaceDeclaration } from 'ts-morph';
import { gettypeInfosByExportName, getDetailTypeByString, parseTypeImport } from './typeAction';
import { varibleIsFunction, getReturns, getReturnsByVarible, getParamsList, getParamsListByVarible } from './functionParse';
import { lineSysbol, setting } from '../global';

let useTypes: UseTypes;
// 更新一个函数声明
function setFunctionDeclarationMap(functionDeclarationMap: FunctionMap, hooksDeclarationMap: FunctionMap, params: Params, returns: Returns, docMap: Record<string, string[][]>, funcName: string) {
    const ishooks = funcName.startsWith('use');
    if (ishooks) {
        hooksDeclarationMap = {
            ...hooksDeclarationMap,
            [funcName]: {
                params,
                returns,
                docs: docMap
            }
        };
    } else {
        functionDeclarationMap = {
            ...functionDeclarationMap,
            [funcName]: {
                params,
                returns,
                docs: docMap
            }
        };
    }
    return [functionDeclarationMap, hooksDeclarationMap];
}
// 收集jsDoc
export function collectDoc(doc: JSDoc) {
    if (!doc) return null;
    const docMap: Record<string, string[][]> = {
        comment: [[doc.getComment() as string || '']]
    };
    for (const jsDocTag of doc.getTags()) {
        const [tagName, ...rest] = jsDocTag.getText().replaceAll('*', '').trim().split(' ');
        if (docMap[tagName]) {
            docMap[tagName].push(rest);
        } else {
            docMap[tagName] = [rest];
        }
    }
    return Object.keys(docMap).length ? docMap : null;
}

// 处理箭头函数
function collectVaribleFunc(variable: VariableStatement, ishooks: boolean) {
    if (!variable.isExported()) return null;
    // 判断是否是函数
    if (!varibleIsFunction(variable)) {
        return {};
    }
    // 获取参数和返回值
    const params: Params = getParamsListByVarible(variable, ishooks ? useTypes.hooks : useTypes.util);
    const returns: Returns = getReturnsByVarible(variable, ishooks ? useTypes.hooks : useTypes.util);
    return {
        params,
        returns
    };
}
// 处理function关键字定义的函数
function collectFunctionDeclaration(variable: FunctionDeclaration, ishooks: boolean, { typeChecker }) {
    if (!variable.isExported()) return null;

    // 获取参数和返回值
    const params: Params = getParamsList(variable, ishooks ? useTypes.hooks : useTypes.util);
    const returns: Returns = getReturns(variable, { typeChecker }, ishooks ? useTypes.hooks : useTypes.util);

    return {
        params,
        returns
    };
}
// 收集函数
function collectFunctions(sourceFile: SourceFile, { typeChecker }): {
    functionDeclarationMap: FunctionMap, hooksDeclarationMap: FunctionMap
} {
    let functionDeclarationMap: FunctionMap = null;
    let hooksDeclarationMap: FunctionMap = null;
    // 获取文件中的变量，判断箭头函数
    const variableStatements = sourceFile.getVariableStatements();
    for (const varible of variableStatements) {
        const varibleName = varible.getDeclarationList().getDeclarations()[0].getName();
        // 获取参数和返回值
        const paramsAndReturns = collectVaribleFunc(varible, varibleName.startsWith('use'));
        if(!paramsAndReturns) continue;
        const { params, returns } = paramsAndReturns;
        const docMap = collectDoc(varible.getJsDocs()[0]);
        [functionDeclarationMap, hooksDeclarationMap] = setFunctionDeclarationMap(functionDeclarationMap, hooksDeclarationMap, params, returns, docMap, varibleName);
    }
    // 获取文件中的函数
    const functions = sourceFile.getFunctions();
    for (const functionDeclaration of functions) {
        const funcName = functionDeclaration.getName();
        if (funcName === undefined) break;
        // 获取参数和返回值
        const paramsAndReturns = collectFunctionDeclaration(functionDeclaration, funcName.startsWith('use'), { typeChecker });
        if(!paramsAndReturns) continue;
        const { params, returns } = paramsAndReturns;
        const docMap = collectDoc(functionDeclaration.getJsDocs()[0]);
        [functionDeclarationMap, hooksDeclarationMap] = setFunctionDeclarationMap(functionDeclarationMap, hooksDeclarationMap, params, returns, docMap, funcName);
    }
    // 默认导出
    const defaultExport = sourceFile.getDefaultExportSymbol();
    if (defaultExport) {
        const defaultDeclaraation:any = defaultExport.getDeclarations()[0];
        const ishooks = sourceFile.getBaseName().startsWith('use');
        if (varibleIsFunction(defaultDeclaraation.getText())) {
            // 获取参数和返回值
            const params: Params = getParamsListByVarible(defaultDeclaraation, ishooks ? useTypes.hooks : useTypes.util);
            const returns: Returns = getReturnsByVarible(defaultDeclaraation, ishooks ? useTypes.hooks : useTypes.util);
            const docMap = collectDoc(defaultDeclaraation.getJsDocs()[0]);
            [functionDeclarationMap, hooksDeclarationMap] = setFunctionDeclarationMap(functionDeclarationMap, hooksDeclarationMap, params, returns, docMap, (ishooks ? sourceFile.getBaseName() : 'default') + '(默认导出)');
        }
    }
    return { functionDeclarationMap, hooksDeclarationMap };
}
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
                const t = gettypeInfosByExportName(moduleSpecifierSourceFile, name, false);
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

// 收集文件中的类型,键值为类型名
const collectTypes = (sourceFile: SourceFile, useTypes: UseTypes): {
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

// 收集文件注释
const collectFileDoc = (sourceFile: SourceFile) => {
    const fileText = sourceFile.getFullText().trim();
    const match = fileText.match(/^\/\*\*\s*\n([\s\S]*?)\s*\*\//);
    const fileDocMap: Record<string, string> = {};
    if(match && match[1].includes('@file')) {
        for(const line of match[1].split(lineSysbol)) {
            if(line.includes('@file')) continue;
            const [tagName, ...rest] = line.replace(/^[ *]+?@/, '@').split(' ');
            fileDocMap[tagName] = rest.join();
        }
    }
    return Object.keys(fileDocMap).length ? fileDocMap : null;
};

export function collect(paths) {

    // 创建一个收集map, key为文件名, value为文件中的函数Map
    const collectMap: CollectMap = {
        hooks: {},
        utils: {},
        globalTypes: {}
    };

    // 创建一个项目实例
    const project = new Project();

    const typeChecker = project.getTypeChecker();

    // 添加要分析的文件
    project.addSourceFilesAtPaths(paths.split(' '));
    const sourceFiles = project.getSourceFiles();

    for (const sourceFile of sourceFiles) {
        if(sourceFile.getBaseName().endsWith('.d.ts')) continue;
        // 搜集hooks用到过的接口类型
        useTypes = {
            util: new Set<string>(),
            hooks: new Set<string>(),
        };
        const fileDocMap: Record<string, string> = collectFileDoc(sourceFile);
        const { functionDeclarationMap, hooksDeclarationMap } = collectFunctions(sourceFile, { typeChecker });
        const { globalType, fileType } = collectTypes(sourceFile, useTypes);
        // hooks
        if(hooksDeclarationMap) {
            collectMap.hooks[sourceFile.getBaseName()] = {
                value: hooksDeclarationMap,
                types: Object.keys(fileType.hooks).length ? fileType.hooks : null,
                fileDoc: fileDocMap
            };
        }
        // utils
        if(functionDeclarationMap) {
            collectMap.utils[sourceFile.getBaseName()] = {
                value: functionDeclarationMap,
                types: Object.keys(fileType.util).length ? fileType.util : null,
                fileDoc: fileDocMap
            };
        }
        // globalTypes
        if(globalType) {
            collectMap.globalTypes[sourceFile.getBaseName()] = globalType;
        }
    }
    return collectMap;
}