import { CollectMap, UseTypes } from '@/types';
import { Project } from 'ts-morph';
import { collectFileDoc } from './collectDoc';
import { collectFunctions } from './collectFunc';
import { collectTypes } from './collectTypes';
import { setReturnSymbol } from '@/global';

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

    // 添加要分析的文件
    project.addSourceFilesAtPaths(paths.split(' '));
    const sourceFiles = project.getSourceFiles();

    for (const sourceFile of sourceFiles) {
        if(sourceFile.getBaseName().endsWith('.d.ts')) continue;
        setReturnSymbol(sourceFile.getText());
        // 搜集hooks用到过的接口类型
        useTypes = {
            util: new Set<string>(),
            hooks: new Set<string>(),
            typeToFileMap: {}
        };
        const fileDocMap: Record<string, string> = collectFileDoc(sourceFile);
        const { functionDeclarationMap, hooksDeclarationMap } = collectFunctions(sourceFile, { useTypes });
        const { globalTargetTypes, globalFileTypes, fileType } = collectTypes(sourceFile, useTypes);
        // hooks
        if(hooksDeclarationMap) {
            collectMap.hooks[sourceFile.getBaseName()] = {
                value: hooksDeclarationMap,
                types: Object.keys(fileType.hooks).length ? fileType.hooks : null,
                fileDoc: fileDocMap,
                useTypesFileMap: useTypes.typeToFileMap,
            };
        }
        // utils
        if(functionDeclarationMap) {
            collectMap.utils[sourceFile.getBaseName()] = {
                value: functionDeclarationMap,
                types: Object.keys(fileType.util).length ? fileType.util : null,
                fileDoc: fileDocMap,
                useTypesFileMap: useTypes.typeToFileMap,
            };
        }
        // globalTypes
        if(globalFileTypes) {
            collectMap.globalTypes[sourceFile.getBaseName()] = globalFileTypes;
        }
        if(globalTargetTypes) {
            for(const fileName in globalTargetTypes) {
                collectMap.globalTypes[fileName] = {
                    ...collectMap.globalTypes[fileName],
                    ...globalTargetTypes[fileName]
                };
            }
        }
    }
    return collectMap;
}