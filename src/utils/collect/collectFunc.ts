import { FunctionDeclaration, VariableDeclaration, Node } from 'ts-morph';
import { FunctionItem, TypeDeclaration } from '@/types';
import { getParamsList } from './collectParams';
import { getReturns } from './collectReturns';
import { filterTypeList } from '../type/typeParse';
import { collectDoc } from './collectDoc';
// import { varibleIsFunction } from '../functionUtil';
// import { parseFileName } from '../fileUtils';

// 收集函数
export function collectFunction(functionDeclaration: FunctionDeclaration | VariableDeclaration): [FunctionItem, TypeDeclaration[]] {

    const { paramsList, typeList } = getParamsList(functionDeclaration);
    const { returns, typeList: typeList1 } = getReturns(functionDeclaration);

    let jsDocs;
    if (Node.isFunctionDeclaration(functionDeclaration)) {
        jsDocs = functionDeclaration.getJsDocs()[0];
    } else if (Node.isVariableDeclaration(functionDeclaration)) {
        const initializer = functionDeclaration.getInitializer();
        if (initializer && (Node.isArrowFunction(initializer) || Node.isFunctionExpression(initializer))) {
            // 获取变量声明的父节点
            const parent = functionDeclaration?.getParent()?.getParent();
            if (Node.isVariableStatement(parent)) {
            // 获取变量声明的 JSDoc 注释
                jsDocs = parent.getJsDocs()[0];
            }
        }
    }

    // TODO 返回值描述
    return [{
        name: functionDeclaration.getName(),
        params: paramsList,
        returns,
        docs: collectDoc(jsDocs),
        // 默认导出是，名称为undefined
        classify: functionDeclaration.getName()?.startsWith('use') ? 'hooks' : 'utils',
    }, filterTypeList([...typeList, ...typeList1])];

    // 记录是否默认导出函数
    // let isDefaultExport:boolean = false;
    // for (const funcs of [variableStatements, functions]) {
    //     for(const func of funcs) {
    //         let varibleName = '';
    //         if(func instanceof VariableStatement) {
    //             varibleName = func.getDeclarationList().getDeclarations()[0].getName();
    //         }else{
    //             varibleName = func.getName();
    //         }
    //         isDefaultExport = func.isDefaultExport();
    //         if(isDefaultExport && varibleName === undefined) {
    //             varibleName = '';
    //         }
    //         // 获取参数和返回值
    //         const paramsAndReturns = collectVaribleFunc(func, varibleName.startsWith('use'), useTypes);
    //         if(!paramsAndReturns) continue;
    //         funcNames[varibleName] = func;
    //         const { params, returns } = paramsAndReturns;
    //         const docMap = collectDoc(func.getJsDocs()[0]);
    //         [functionDeclarationMap, hooksDeclarationMap] = setFunctionDeclarationMap(functionDeclarationMap, hooksDeclarationMap, params, returns, docMap, isDefaultExport ? `${varibleName}(默认导出)` : varibleName);
    //     }
    // }
    // // 默认导出
    // const defaultExport = sourceFile.getDefaultExportSymbol();
    // if (defaultExport && !isDefaultExport) {
    //     let defaultDeclaraation = defaultExport.getDeclarations()[0] as FunctionDeclaration;
    //     // 文件是否为hooks
    //     const ishooks = sourceFile.getBaseName().startsWith('use');
    //     const defaultName = defaultDeclaraation.getText().match(/export\s*default(.*?);?$/)?.[1]?.trim();
    //     const isFunc = varibleIsFunction(defaultDeclaraation.getText());
    //     if (isFunc || Object.keys(funcNames).includes(defaultName)) {
    //         if(!isFunc) {
    //             defaultDeclaraation = funcNames[defaultName];
    //         }
    //         // 获取参数和返回值
    //         const params: Params = getParamsList(defaultDeclaraation, ishooks ? useTypes.hooks : useTypes.util);
    //         const returns: Returns = getReturns(defaultDeclaraation, ishooks ? useTypes.hooks : useTypes.util);
    //         const docMap = collectDoc(defaultDeclaraation.getJsDocs()[0]);
    //         [functionDeclarationMap, hooksDeclarationMap] = setFunctionDeclarationMap(functionDeclarationMap, hooksDeclarationMap, params, returns, docMap, (ishooks ? parseFileName(sourceFile.getBaseName()) : 'default') + '(默认导出)');
    //     }
    // }
    // return { functionDeclarationMap, hooksDeclarationMap };
}