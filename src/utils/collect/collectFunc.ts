import { VariableStatement, FunctionDeclaration, SourceFile } from 'ts-morph';
import { FunctionMap, Params, Returns, UseTypes } from '@/types';
import { getParamsList } from './collectParams';
import { getReturns } from './collectReturns';
import { collectDoc } from './collectDoc';
import { varibleIsFunction } from '../functionUtil';
import { parseFileName } from '../fileUtils';

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

/** 获取函数参数和返回值 */
function collectVaribleFunc(variable: VariableStatement | FunctionDeclaration, ishooks: boolean, useTypes:UseTypes) {
    if (!variable.isExported()) return null;
    // 判断是否是函数
    if (variable instanceof VariableStatement && !varibleIsFunction(variable)) {
        return null;
    }
    // 获取参数和返回值
    const params: Params = getParamsList(variable, ishooks ? useTypes.hooks : useTypes.util);
    const returns: Returns = getReturns(variable, ishooks ? useTypes.hooks : useTypes.util);
    return {
        params,
        returns
    };
}

// 收集函数
export function collectFunctions(sourceFile: SourceFile, { useTypes } :{useTypes:UseTypes}): {
    functionDeclarationMap: FunctionMap, hooksDeclarationMap: FunctionMap
} {
    // 用于记录文件中的函数名，匹配默认导出的声明类型
    const funcNames = {};
    let functionDeclarationMap: FunctionMap = null;
    let hooksDeclarationMap: FunctionMap = null;
    // 获取文件中的变量，判断箭头函数
    const variableStatements = sourceFile.getVariableStatements();
    // 获取文件中的函数
    const functions = sourceFile.getFunctions();
    // 记录是否默认导出函数
    let isDefaultExport:boolean = false;
    for (const funcs of [variableStatements, functions]) {
        for(const func of funcs) {
            let varibleName = '';
            if(func instanceof VariableStatement) {
                varibleName = func.getDeclarationList().getDeclarations()[0].getName();
            }else{
                varibleName = func.getName();
            }
            isDefaultExport = func.isDefaultExport();
            if(isDefaultExport && varibleName === undefined) {
                varibleName = '';
            }
            // 获取参数和返回值
            const paramsAndReturns = collectVaribleFunc(func, varibleName.startsWith('use'), useTypes);
            if(!paramsAndReturns) continue;
            funcNames[varibleName] = func;
            const { params, returns } = paramsAndReturns;
            const docMap = collectDoc(func.getJsDocs()[0]);
            [functionDeclarationMap, hooksDeclarationMap] = setFunctionDeclarationMap(functionDeclarationMap, hooksDeclarationMap, params, returns, docMap, isDefaultExport ? `${varibleName}(默认导出)` : varibleName);
        }
    }
    // 默认导出
    const defaultExport = sourceFile.getDefaultExportSymbol();
    if (defaultExport && !isDefaultExport) {
        let defaultDeclaraation = defaultExport.getDeclarations()[0] as FunctionDeclaration;
        // 文件是否为hooks
        const ishooks = sourceFile.getBaseName().startsWith('use');
        const defaultName = defaultDeclaraation.getText().match(/export\s*default(.*?);?$/)?.[1]?.trim();
        const isFunc = varibleIsFunction(defaultDeclaraation.getText());
        if (isFunc || Object.keys(funcNames).includes(defaultName)) {
            if(!isFunc) {
                defaultDeclaraation = funcNames[defaultName];
            }
            // 获取参数和返回值
            const params: Params = getParamsList(defaultDeclaraation, ishooks ? useTypes.hooks : useTypes.util);
            const returns: Returns = getReturns(defaultDeclaraation, ishooks ? useTypes.hooks : useTypes.util);
            const docMap = collectDoc(defaultDeclaraation.getJsDocs()[0]);
            [functionDeclarationMap, hooksDeclarationMap] = setFunctionDeclarationMap(functionDeclarationMap, hooksDeclarationMap, params, returns, docMap, (ishooks ? parseFileName(sourceFile.getBaseName()) : 'default') + '(默认导出)');
        }
    }
    return { functionDeclarationMap, hooksDeclarationMap };
}