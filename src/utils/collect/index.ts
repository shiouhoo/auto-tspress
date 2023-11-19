import { CollectMap, TypeDeclaration, FunctionItem } from '@/types';
import { Project, FunctionDeclaration, Node } from 'ts-morph';
import { collectFileDoc } from './collectDoc';
import { collectFunction } from './collectFunc';
import { getInterface } from './collectTypes';
import { setReturnSymbol, config, tsMorph } from '@/global';
// import { parseFileName } from '../fileUtils';
import { judgeExportedDeclarationsIsFunction } from '../functionUtil';
import { log } from '@/log';

export function collect() {

    // 创建一个收集map, key为文件名, value为文件中的函数Map
    const collectMap: CollectMap = {
        hooks: [],
        utils: [],
        globalTypes: []
    };

    // 创建一个项目实例
    const project = new Project({
        tsConfigFilePath: 'tsconfig.json',
        skipAddingFilesFromTsConfig: true,
    });

    // 添加要分析的文件
    project.addSourceFilesAtPaths([...config.include, ...config.exclude]);
    const sourceFiles = project.getSourceFiles();

    // 设置tsMorph全局变量
    tsMorph.project = project;
    tsMorph.typeChecker = project.getTypeChecker();

    for (const sourceFile of sourceFiles) {
        if(sourceFile.getBaseName().trimEnd().endsWith('.d.ts')) continue;
        setReturnSymbol(sourceFile.getText());

        tsMorph.sourchFile = sourceFile;

        log.log('开始收集文件: ' + sourceFile.getBaseName());

        const fileDocMap: Record<string, string> = collectFileDoc(sourceFile);

        const utilsFunctionList: FunctionItem[] = [];
        const hooksFunctionList: FunctionItem[] = [];
        const hooksTypeList: TypeDeclaration[] = [];
        const utilsTypeList: TypeDeclaration[] = [];
        const globalTypeList: TypeDeclaration[] = [];
        const linkList: {name: string, path:string}[] = [];

        // 获取所有导出声明
        const exportedDeclarations = sourceFile.getExportedDeclarations();

        for (const [name, declarations] of exportedDeclarations) {
            console.log('Found default export:' + name);
            for (const declaration of declarations) {
                // 判断是否是函数
                if(judgeExportedDeclarationsIsFunction(declaration)) {
                    const [funcItem, typeList] = collectFunction(declaration as FunctionDeclaration);
                    if(funcItem.classify === 'utils') {
                        utilsFunctionList.push(funcItem);
                    }else{
                        hooksFunctionList.push(funcItem);
                    }
                    for(const t of typeList) {
                        if(!['interface'].includes(t.type)) continue;
                        if(t.isGlobal) {
                            // TODO 全局path不对
                            linkList.push({
                                name: t.value,
                                path: '#' + t.value.toLowerCase()
                            });
                            globalTypeList.push(t);
                        }else{
                            linkList.push({
                                name: t.value,
                                path: '#' + t.value.toLowerCase()
                            });
                            if(funcItem.classify === 'utils') {
                                utilsTypeList.push(t);
                            }else{
                                hooksTypeList.push(t);
                            }
                        }
                    }
                }else if (Node.isTypeAliasDeclaration(declaration)) {
                    console.log('The declaration is a type alias');
                } else if (Node.isInterfaceDeclaration(declaration)) {
                    console.log('The declaration is an interface');
                    globalTypeList.push(...getInterface(declaration));
                } else if (Node.isEnumDeclaration(declaration)) {
                    console.log('The declaration is an enum');
                }
            }
        }

        utilsFunctionList.length && collectMap.utils.push({
            name: sourceFile.getBaseName(),
            filePath: sourceFile.getFilePath(),
            fileDoc: fileDocMap,
            functionList: utilsFunctionList,
            typeList: utilsTypeList,
            link: linkList,
        });

        hooksFunctionList.length && collectMap.hooks.push({
            name: sourceFile.getBaseName(),
            filePath: sourceFile.getFilePath(),
            fileDoc: fileDocMap,
            functionList: hooksFunctionList,
            typeList: hooksTypeList,
            link: linkList,
        });

        globalTypeList.length && collectMap.globalTypes.push({
            name: sourceFile.getBaseName(),
            filePath: sourceFile.getFilePath(),
            fileDoc: fileDocMap,
            typeList: globalTypeList,
            link: linkList,
        });

        // const { functionDeclarationMap, hooksDeclarationMap } = collectFunctions(sourceFile, { collectedTypeList });
        // return;
        // const { globalTargetTypes, globalFileTypes, fileType } = collectTypes(sourceFile, useTypes);
        // const fileName = parseFileName(sourceFile.getBaseName());
        // // hooks
        // if(hooksDeclarationMap) {
        //     collectMap.hooks[fileName] = {
        //         value: hooksDeclarationMap,
        //         types: Object.keys(fileType.hooks).length ? fileType.hooks : null,
        //         fileDoc: fileDocMap,
        //         useTypesFileMap: useTypes.typeToFileMap,
        //     };
        // }
        // // utils
        // if(functionDeclarationMap) {
        //     collectMap.utils[fileName] = {
        //         value: functionDeclarationMap,
        //         types: Object.keys(fileType.util).length ? fileType.util : null,
        //         fileDoc: fileDocMap,
        //         useTypesFileMap: useTypes.typeToFileMap,
        //     };
        // }
        // // globalTypes
        // if(globalFileTypes) {
        //     collectMap.globalTypes[fileName] = globalFileTypes;
        // }
        // if(globalTargetTypes) {
        //     for(const fileName in globalTargetTypes) {
        //         collectMap.globalTypes[fileName] = {
        //             ...collectMap.globalTypes[fileName],
        //             ...globalTargetTypes[fileName]
        //         };
        //     }
        // }
    }
    return collectMap;
}