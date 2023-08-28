import { FunctionMap, Params, Returns } from './../types/index';
import { Project, VariableStatement, FunctionDeclaration } from 'ts-morph';

import { varibleIsFunction, getReturns, getReturnsByVarible, getParamsList, getParamsListByVarible } from './functionParse';

// 更新一个函数声明
function setFunctionDeclarationMap(functionDeclarationMap: FunctionMap, params: Params, returns: Returns, funcName: string) {
    if(params || returns) {
        functionDeclarationMap = {
            ...functionDeclarationMap,
            [funcName]: {
                params,
                returns
            }
        };
    }
    return functionDeclarationMap;
}

// 处理箭头函数
function collectVaribleFunc(variable: VariableStatement) {
    if(!variable.isExported()) return {};
    // 判断是否是函数
    if (!varibleIsFunction(variable)) {
        return {};
    }
    // 获取参数和返回值
    const params: Params = getParamsListByVarible(variable);
    const returns: Returns = getReturnsByVarible(variable);

    return {
        params,
        returns
    };
}
// 处理function关键字定义的函数
function collectFunctionDeclaration(variable: FunctionDeclaration, { typeChecker }) {
    if(!variable.isExported()) return {};

    // 获取参数和返回值
    const params: Params = getParamsList(variable, { typeChecker });
    const returns: Returns = getReturns(variable, { typeChecker });

    return {
        params,
        returns
    };
}

export function collect(paths) {

    // 创建一个收集map, key为文件名, value为文件中的函数Map
    const collectMap: Record<string, FunctionMap> = {};

    // 创建一个项目实例
    const project = new Project();

    const typeChecker = project.getTypeChecker();

    // 添加要分析的文件
    for(const path of paths.split(' ')) {
        project.addSourceFilesAtPaths(path);
    }
    const sourceFiles = project.getSourceFiles();

    for (const sourceFile of sourceFiles) {
        let functionDeclarationMap: FunctionMap = null;
        // 获取文件中的变量，判断箭头函数
        const variableStatements = sourceFile.getVariableStatements();
        for(const varible of variableStatements) {
            const varibleName = varible.getDeclarationList().getDeclarations()[0].getName();
            // 获取参数和返回值
            const { params, returns } = collectVaribleFunc(varible);
            functionDeclarationMap = setFunctionDeclarationMap(functionDeclarationMap, params, returns, varibleName);
        }
        // 获取文件中的函数
        const functions = sourceFile.getFunctions();
        for(const functionDeclaration of functions) {
            const funcName = functionDeclaration.getName();
            // 获取参数和返回值
            const { params, returns } = collectFunctionDeclaration(functionDeclaration, { typeChecker });
            functionDeclarationMap = setFunctionDeclarationMap(functionDeclarationMap, params, returns, funcName);
        }
        collectMap[sourceFile.getBaseName()] = functionDeclarationMap;
    }
    return collectMap;
}