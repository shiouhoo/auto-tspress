import { CollectMap, UseTypes } from './../../types/index';
import { Project } from 'ts-morph';
import { collectFileDoc } from './collectDoc';
import { collectFunctions } from './collectFunc';
import { collectTypes } from './collectTypes';

let useTypes: UseTypes;

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
        const { functionDeclarationMap, hooksDeclarationMap } = collectFunctions(sourceFile, { typeChecker, useTypes });
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