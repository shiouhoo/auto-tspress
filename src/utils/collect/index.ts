import { CollectMap, TypeDeclaration, FunctionItem } from '@/types';
import { Project, FunctionDeclaration, Node } from 'ts-morph';
import { collectFileDoc } from './collectDoc';
import { collectFunction } from './collectFunc';
import { collectEnum, collectInterface, collectType } from './collectTypes';
import { setReturnSymbol, config, tsMorph } from '@/global';
// import { parseFileName } from '../fileUtils';
import { judgeExportedDeclarationsIsFunction } from '../functionUtil';
import { log } from '@/log';
import { shouldPushTypeList } from '../type/typeCheck';
import { filterTypeList } from '../type/typeParse';

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

        log.log('-----------------------');
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
            for (const declaration of declarations) {
                // 判断是否是函数
                if(judgeExportedDeclarationsIsFunction(declaration)) {
                    log.log('✔ 找到函数：' + name);
                    const [funcItem, typeList] = collectFunction(declaration as FunctionDeclaration);
                    // 防止名称为undefined
                    funcItem.name ||= name + '(默认导出)';
                    if(funcItem.classify === 'utils') {
                        utilsFunctionList.push(funcItem);
                    }else{
                        hooksFunctionList.push(funcItem);
                    }
                    // 收集link，跳转到类型详情
                    for(const t of typeList) {
                        if(!shouldPushTypeList(t)) continue;
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
                // 类型收集
                }else {
                    const typeList = [];
                    if (Node.isTypeAliasDeclaration(declaration)) {
                        log.log('✔ 找到type：' + name);
                        const { type, deps } = collectType(declaration);
                        globalTypeList.push(type, ...deps);
                        typeList.push(...deps);
                    } else if (Node.isInterfaceDeclaration(declaration)) {
                        log.log('✔ 找到interface：' + name);
                        const { type, deps } = collectInterface(declaration);
                        globalTypeList.push(type, ...deps);
                        typeList.push(...deps);
                    } else if (Node.isEnumDeclaration(declaration)) {
                        log.log('✔ 找到enum：' + name);
                        const { type, deps } = collectEnum(declaration);
                        globalTypeList.push(type, ...deps);
                        typeList.push(...deps);
                    }
                    for(const t of typeList) {
                        linkList.push({
                            name: t.value,
                            path: '#' + t.value.toLowerCase()
                        });
                    }
                }

            }
        }

        utilsFunctionList.length && collectMap.utils.push({
            name: sourceFile.getBaseName(),
            filePath: sourceFile.getFilePath(),
            fileDoc: fileDocMap,
            functionList: utilsFunctionList,
            typeList: filterTypeList(utilsTypeList),
            link: linkList,
        });

        hooksFunctionList.length && collectMap.hooks.push({
            name: sourceFile.getBaseName(),
            filePath: sourceFile.getFilePath(),
            fileDoc: fileDocMap,
            functionList: hooksFunctionList,
            typeList: filterTypeList(hooksTypeList),
            link: linkList,
        });

        globalTypeList.length && collectMap.globalTypes.push({
            name: sourceFile.getBaseName(),
            filePath: sourceFile.getFilePath(),
            fileDoc: fileDocMap,
            typeList: filterTypeList(globalTypeList),
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