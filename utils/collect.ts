import { FunctionMap, Params, Returns } from './../types/index';
import { Project, SyntaxKind, FunctionDeclaration, VariableDeclaration } from 'ts-morph';

import { varibleIsFunction, getReturns, getReturnsByVarible, getParamsList, getParamsListByVarible } from './functionParse';

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
        // 获取文件中导出的函数
        const exportDeclarations = sourceFile.getExportedDeclarations();

        for(const [declarationName, declarationArr] of exportDeclarations) {
            // 判断是否是函数
            if (declarationArr[0].getKind() === SyntaxKind.FunctionDeclaration
                && !varibleIsFunction(<VariableDeclaration>declarationArr[0])) {
                return;
            }
            const declaration = declarationArr[0];

            // 参数
            const params: Params = varibleIsFunction(<VariableDeclaration>declaration)
                ? getParamsListByVarible(<VariableDeclaration>declaration)
                : getParamsList(<FunctionDeclaration>declaration, { typeChecker });
            // 返回值
            const returns: Returns = varibleIsFunction(<VariableDeclaration>declaration)
                ? getReturnsByVarible(<VariableDeclaration>declaration)
                : getReturns(<FunctionDeclaration>declaration, { typeChecker });

            // tsDoc
            if(params || returns) {
                functionDeclarationMap = {
                    ...functionDeclarationMap,
                    [declarationName]: {
                        params,
                        returns
                    }
                };
            }
        }
        collectMap[sourceFile.getBaseName()] = functionDeclarationMap;
    }
    return collectMap;
}