import { VariableStatement, FunctionDeclaration, SourceFile, TypeChecker } from 'ts-morph';
import { FunctionMap, Params, Returns, UseTypes } from '@/types';
import { getParamsListByVarible, getParamsList } from './collectParams';
import { getReturns, getReturnsByVarible } from './collectReturns';
import { collectDoc } from './collectDoc';
import { varibleIsFunction } from '../functionUtil';

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

// 处理箭头函数
function collectVaribleFunc(variable: VariableStatement, ishooks: boolean, useTypes:UseTypes) {
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
function collectFunctionDeclaration(variable: FunctionDeclaration, ishooks: boolean, { typeChecker, useTypes } :{useTypes:UseTypes, typeChecker:TypeChecker}) {
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
export function collectFunctions(sourceFile: SourceFile, { typeChecker, useTypes } :{useTypes:UseTypes, typeChecker:TypeChecker}): {
    functionDeclarationMap: FunctionMap, hooksDeclarationMap: FunctionMap
} {
    let functionDeclarationMap: FunctionMap = null;
    let hooksDeclarationMap: FunctionMap = null;
    // 获取文件中的变量，判断箭头函数
    const variableStatements = sourceFile.getVariableStatements();
    for (const varible of variableStatements) {
        const varibleName = varible.getDeclarationList().getDeclarations()[0].getName();
        // 获取参数和返回值
        const paramsAndReturns = collectVaribleFunc(varible, varibleName.startsWith('use'), useTypes);
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
        const paramsAndReturns = collectFunctionDeclaration(functionDeclaration, funcName.startsWith('use'), { typeChecker, useTypes });
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