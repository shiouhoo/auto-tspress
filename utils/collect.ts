import { FunctionMap, Params, Returns, CollectMap, TypeItem, TypeValue, UseTypes } from './../types/index';
import { Project, VariableStatement, FunctionDeclaration, JSDoc, SourceFile } from 'ts-morph';
import { gettypeInfosByExportName } from './typeAction';
import { varibleIsFunction, getReturns, getReturnsByVarible, getParamsList, getParamsListByVarible } from './functionParse';
import fs from 'fs';

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
    if (!variable.isExported()) return {};
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
function collectFunctionDeclaration(variable: FunctionDeclaration, ishooks: boolean, { typeChecker, sourceFile }) {
    if (!variable.isExported()) return {};

    // 获取参数和返回值
    const params: Params = getParamsList(variable, ishooks ? useTypes.hooks : useTypes.util, {
        sourceFile
    });
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
        const { params, returns } = collectVaribleFunc(varible, varibleName.startsWith('use'));
        if (!params && !returns) continue;
        const docMap = collectDoc(varible.getJsDocs()[0]);
        [functionDeclarationMap, hooksDeclarationMap] = setFunctionDeclarationMap(functionDeclarationMap, hooksDeclarationMap, params, returns, docMap, varibleName);
    }
    // 获取文件中的函数
    const functions = sourceFile.getFunctions();
    for (const functionDeclaration of functions) {
        const funcName = functionDeclaration.getName();
        // 获取参数和返回值
        const { params, returns } = collectFunctionDeclaration(functionDeclaration, funcName.startsWith('use'), { typeChecker, sourceFile });
        if (!params && !returns) continue;
        const docMap = collectDoc(functionDeclaration.getJsDocs()[0]);
        [functionDeclarationMap, hooksDeclarationMap] = setFunctionDeclarationMap(functionDeclarationMap, hooksDeclarationMap, params, returns, docMap, funcName);
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
        /** 默认导入的名称 */
        const name = importDeclaration.getImportClause().getSymbol()?.getEscapedName();
        // 默认导入
        if (name && [...useTypes.util, ...useTypes.hooks].some(element => element.includes(name))) {
            const t = gettypeInfosByExportName(importDeclaration.getModuleSpecifierSourceFile(), name, true);
            if (useTypes.hooks.has(name)) {
                fileImportsHooks[name] = t;
            }
            if (useTypes.util.has(name)) {
                fileImportsUtil[name] = t;
            }
        }
        // 具名导入
        for (const specifier of importDeclaration.getNamedImports()) {
            const name = specifier.getName();
            if ([...useTypes.hooks, ...useTypes.util].some(element => element.includes(name))) {
                const t = gettypeInfosByExportName(importDeclaration.getModuleSpecifierSourceFile(), name, false);
                if (useTypes.hooks.has(name)) {
                    fileImportsHooks[name] = t;
                }
                if (useTypes.util.has(name)) {
                    fileImportsUtil[name] = t;
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let objects: any;
        if (type === 'interface') {
            objects = sourceFile.getInterfaces();
        } else if (type === 'type') {
            objects = sourceFile.getTypeAliases();
        } else if (type === 'enum') {
            objects = sourceFile.getEnums();
        }
        for (const object of objects) {
            const name: string = object.getName();
            if (!object.isExported() && ![...useTypes.hooks, ...useTypes.util].some(element => element.includes(name))) break;
            // 保存属性列表
            let typeObject: TypeValue = {};
            if (type === 'interface') {
                // 获取接口的属性列表
                const properties = object.getProperties();
                for (const property of properties) {
                    typeObject[property.getName()] = {
                        value: property.getType().getText(),
                        doc: collectDoc(property.getJsDocs()[0])
                    };
                }
            } else if (type === 'type') {
                typeObject = object.getText().split('=')[1];
            } else if (type === 'enum') {
                for (const item of object.getMembers()) {
                    typeObject[item.getName()] = {
                        value: item.getValue(),
                        doc: collectDoc(item.getJsDocs()[0])
                    };
                }
            }
            const tmp: TypeItem = {
                value: typeObject,
                type: type === 'interface' ? 'interface' : type === 'type' ? 'type' : 'enum',
                docs: collectDoc(object.getJsDocs()[0])
            };
            if (object.isExported()) {
                globalTypes[name] = tmp;
            } else {
                if (useTypes.hooks.has(name)) {
                    fileHooksTypes[name] = tmp;
                }
                if (useTypes.util.has(name)) {
                    fileUtilTypes[name] = tmp;
                }
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
export function collect(paths) {

    // 创建一个收集map, key为文件名, value为文件中的函数Map
    const collectMap: CollectMap = {
        hooks: {
        },
        utils: {
        },
        interfaces: {},
        globalTypes: null
    };

    // 创建一个项目实例
    const project = new Project();

    const typeChecker = project.getTypeChecker();

    // 添加要分析的文件
    for (const path of paths.split(' ')) {
        if(!path.includes('*') && !fs.existsSync(path)) {
            throw new Error(`不存在的文件：${path}`);
        }
        project.addSourceFilesAtPaths(path);
    }
    const sourceFiles = project.getSourceFiles();

    for (const sourceFile of sourceFiles) {
        // 搜集hooks用到过的接口类型
        useTypes = {
            util: new Set<string>(),
            hooks: new Set<string>(),
        };
        const { functionDeclarationMap, hooksDeclarationMap } = collectFunctions(sourceFile, { typeChecker });
        const { globalType, fileType } = collectTypes(sourceFile, useTypes);
        collectMap.hooks[sourceFile.getBaseName()] = {
            value: hooksDeclarationMap,
            types: Object.keys(fileType.hooks).length ? fileType.hooks : null
        };
        collectMap.utils[sourceFile.getBaseName()] = {
            value: functionDeclarationMap,
            types: Object.keys(fileType.util).length ? fileType.util : null
        };
        collectMap.globalTypes = {
            [sourceFile.getBaseName()]: globalType
        };
        console.log(useTypes);
    }
    return collectMap;
}