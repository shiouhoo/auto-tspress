import { FunctionMap, Params, Returns, CollectMap, TypeItem } from './../types/index';
import { Project, VariableStatement, FunctionDeclaration, JSDoc, SourceFile } from 'ts-morph';
import { gettypeInfosByExportName } from './typeAction';
import { varibleIsFunction, getReturns, getReturnsByVarible, getParamsList, getParamsListByVarible } from './functionParse';

let useTypes = new Set<string>();

// 更新一个函数声明
function setFunctionDeclarationMap(functionDeclarationMap: FunctionMap, params: Params, returns: Returns, docMap:Record<string, string[][]>, funcName: string) {
    functionDeclarationMap = {
        ...functionDeclarationMap,
        [funcName]: {
            params,
            returns,
            docs: docMap
        }
    };
    return functionDeclarationMap;
}
// 收集jsDoc
function collectDoc(doc: JSDoc) {
    if(!doc) return null;
    const docMap:Record<string, string[][]> = {
        comment: [[doc.getComment() as string]]
    };
    for(const jsDocTag of doc.getTags()) {
        const [tagName, ...rest] = jsDocTag.getText().replaceAll('*', '').trim().split(' ');
        if(docMap[tagName]) {
            docMap[tagName].push(rest);
        }else{
            docMap[tagName] = [rest];
        }
    }
    return Object.keys(docMap).length ? docMap : null;
}

// 处理箭头函数
function collectVaribleFunc(variable: VariableStatement) {
    if(!variable.isExported()) return {};
    // 判断是否是函数
    if (!varibleIsFunction(variable)) {
        return {};
    }
    // 获取参数和返回值
    const params: Params = getParamsListByVarible(variable, useTypes);
    const returns: Returns = getReturnsByVarible(variable, useTypes);

    return {
        params,
        returns
    };
}
// 处理function关键字定义的函数
function collectFunctionDeclaration(variable: FunctionDeclaration, { typeChecker }) {
    if(!variable.isExported()) return {};

    // 获取参数和返回值
    const params: Params = getParamsList(variable, useTypes);
    const returns: Returns = getReturns(variable, { typeChecker }, useTypes);

    return {
        params,
        returns
    };
}
// 搜集函数
function collectFunctions(sourceFile: SourceFile, { typeChecker }): FunctionMap | null {
    let functionDeclarationMap: FunctionMap = null;
    // 获取文件中的变量，判断箭头函数
    const variableStatements = sourceFile.getVariableStatements();
    for(const varible of variableStatements) {
        const varibleName = varible.getDeclarationList().getDeclarations()[0].getName();
        // 获取参数和返回值
        const { params, returns } = collectVaribleFunc(varible);
        if(!params && !returns) continue;
        const docMap = collectDoc(varible.getJsDocs()[0]);
        functionDeclarationMap = setFunctionDeclarationMap(functionDeclarationMap, params, returns, docMap, varibleName);
    }
    // 获取文件中的函数
    const functions = sourceFile.getFunctions();
    for(const functionDeclaration of functions) {
        const funcName = functionDeclaration.getName();
        // 获取参数和返回值
        const { params, returns } = collectFunctionDeclaration(functionDeclaration, { typeChecker });
        const docMap = collectDoc(functionDeclaration.getJsDocs()[0]);
        functionDeclarationMap = setFunctionDeclarationMap(functionDeclarationMap, params, returns, docMap, funcName);
    }
    return functionDeclarationMap;
}

// 搜集文件中的interface
const collectInterfaceType = (sourceFile: SourceFile, useTypes: Set<string>)=>{
    // 保存接口对应的属性列表
    const fileInterfaces:Record<string, TypeItem> = {};
    const globalInterfaces:Record<string, TypeItem> = {};

    const interfaces = sourceFile.getInterfaces();
    for(const inter of interfaces) {
        const interName = inter.getName();
        if(!inter.isExported() && !Array.from(useTypes).some(element => element.includes(interName))) continue;
        // 保存属性列表
        const typeObject:Record<string, string> = {};
        // 获取接口的属性列表
        const properties = inter.getProperties();
        for (const property of properties) {
            typeObject[property.getName()] = property.getType().getText();
        }
        if(inter.isExported()) {
            globalInterfaces[interName] = {
                value: typeObject,
                type: 'interface'
            };
        }else{
            fileInterfaces[interName] = {
                value: typeObject,
                type: 'interface'
            };
        }
    }
    return { fileInterfaces, globalInterfaces };
};

// 搜集type关键字定义的类型
const collectNameType = (sourceFile: SourceFile, useTypes: Set<string>)=>{

    // 保存接口对应的属性列表
    const fileTypes:Record<string, TypeItem> = {};
    const globalTypes:Record<string, TypeItem> = {};

    const typeAliases = sourceFile.getTypeAliases();
    for(const typeAliay of typeAliases) {
        const name = typeAliay.getName();
        const type = typeAliay.getText().split('=')[1];
        if(!typeAliay.isExported() && !Array.from(useTypes).some(element => element.includes(name))) continue;
        if(typeAliay.isExported()) {
            globalTypes[name] = {
                value: type,
                type: 'type'
            };
        }else{
            fileTypes[name] = {
                value: type,
                type: 'type'
            };
        }
    }
    return { globalTypes, fileTypes };
};

// 收集文件中的枚举
const collectEnumType = (sourceFile: SourceFile, useTypes: Set<string>)=>{

    // 保存对应的属性列表
    const fileEnums:Record<string, TypeItem> = {};
    const globalEnums:Record<string, TypeItem> = {};

    const enums = sourceFile.getEnums();
    for(const en of enums) {
        const name = en.getName();
        // 保存属性列表
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const typeObject:Record<string, any> = {};
        for(const item of en.getMembers()) {
            typeObject[item.getName()] = item.getValue();
        }
        if(!en.isExported() && !Array.from(useTypes).some(element => element.includes(name))) continue;
        if(en.isExported()) {
            globalEnums[name] = {
                value: typeObject,
                type: 'enum'
            };
        }else{
            fileEnums[name] = {
                value: typeObject,
                type: 'enum'
            };
        }
    }
    return { fileEnums, globalEnums };
};
// 收集import导入的类型
const collectImportTypes = (sourceFile: SourceFile, useTypes: Set<string>)=>{

    // 保存对应的属性列表
    const fileImports:Record<string, TypeItem> = {};

    const importDeclarations = sourceFile.getImportDeclarations();
    for(const importDeclaration of importDeclarations) {
        const name = importDeclaration.getImportClause().getSymbol()?.getEscapedName();
        if(name && Array.from(useTypes).some(element => element.includes(name))) {
            fileImports[name] = {
                value: 'any',
                type: 'any',
            };
            // TODO 获取具体信息
            gettypeInfosByExportName(importDeclaration.getModuleSpecifierSourceFile(), name, true);
        }
        for(const specifier of importDeclaration.getNamedImports()) {
            const name = specifier.getName();
            if(Array.from(useTypes).some(element => element.includes(name))) {
                fileImports[name] = gettypeInfosByExportName(importDeclaration.getModuleSpecifierSourceFile(), name, false);
            }
        }
    }
    return Object.keys(fileImports).length ? fileImports : null;
};
// 收集文件中的类型
const collectTypes = (sourceFile: SourceFile, useTypes: Set<string>): {
    globalType: Record<string, TypeItem>,
    fileType: Record<string, TypeItem>
}=>{
    const { fileInterfaces, globalInterfaces } = collectInterfaceType(sourceFile, useTypes);
    const { globalTypes, fileTypes } = collectNameType(sourceFile, useTypes);
    const { globalEnums, fileEnums } = collectEnumType(sourceFile, useTypes);
    const fileImports = collectImportTypes(sourceFile, useTypes);
    const fileType = {
        ...fileInterfaces,
        ...fileTypes,
        ...fileEnums,
        ...fileImports
    };
    const globalType = {
        ...globalInterfaces,
        ...globalTypes,
        ...globalEnums
    };
    return {
        globalType: Object.keys(globalType).length ? globalType : null,
        fileType: Object.keys(fileType).length ? fileType : null,
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
    for(const path of paths.split(' ')) {
        project.addSourceFilesAtPaths(path);
    }
    const sourceFiles = project.getSourceFiles();

    for (const sourceFile of sourceFiles) {
        // 搜集hooks用到过的接口类型
        useTypes = new Set<string>();
        const funcs = collectFunctions(sourceFile, { typeChecker });
        const { globalType, fileType } = collectTypes(sourceFile, useTypes);
        collectMap.utils[sourceFile.getBaseName()] = {
            value: funcs,
            types: fileType
        };
        collectMap.globalTypes = {
            [sourceFile.getBaseName()]: globalType
        };
        console.log(useTypes);
    }
    return collectMap;
}