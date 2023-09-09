import { isSameFilePath } from './../global';
import { FunctionDeclaration, VariableStatement, SourceFile } from 'ts-morph';
import { Params, Returns } from './../types/index';
import { isBaseType, getTypeByText } from './typeAction';

/** 用于记录默认导入对应的类型 */
const pathTypeMap: Record<string, string> = {};

// 判断是否是函数
export const varibleIsFunction = (variable: VariableStatement) => {
    const test = variable.getText().split('\n')[0];
    return test.indexOf('=>') > -1 || test.indexOf('function') > -1;
};

// 获取function参数列表
export const getParamsList = (declaration: FunctionDeclaration, useTypes: Set<string>, { sourceFile }:{sourceFile:SourceFile}) => {
    const params: Params = [];
    for (const param of declaration.getParameters()) {
        let type = param.getType().getText();
        // 默认导入，格式为 import("C:/Users/29729/XX").XX
        if(type.includes('import')) {
            const filePath = type.split('").')[0].replace(/import\("/, '').trim();
            if(pathTypeMap[filePath]) {
                type = pathTypeMap[filePath];
            }else{
                // 类型为导入的名称
                const importDeclarations = sourceFile.getImportDeclarations();
                for (const importDeclaration of importDeclarations) {
                /** 默认导入的名称 */
                    const importPath = importDeclaration.getModuleSpecifierValue();
                    if(isSameFilePath(filePath, importPath)) {
                        type = importDeclaration.getImportClause().getSymbol()?.getEscapedName();
                        pathTypeMap[filePath] = type;
                        break;
                    }
                }

            }
        }
        let defaultValue = '';
        if(param.getText().includes('=')) {
            defaultValue = param.getText().split('=')[1];
        }
        const data = {
            name: param.getName(),
            type,
            isBase: isBaseType(param.getType().getText().trim()),
            isRequire: !param.isOptional(),
            defaultValue: defaultValue || param.getInitializer()?.getText() || '-'
        };
        params.push(data);
        if(!data.isBase && data.type) {
            useTypes.add(data.type);
        }
    }
    return params;
};

// 获取箭头函数参数列表
export const getParamsListByVarible = (declaration: VariableStatement, useTypes: Set<string>) => {
    const params: Params = [];
    const headerText: string = declaration.getText().split('\n')[0];
    const paramsList: string[] = [];
    const paramString = headerText.match(/\((.*)\)/)[1];
    let currentArg = '';
    let bracketLevel = 0;

    for (let i = 0;i < paramString.length;i++) {
        const char = paramString[i];

        if (char === ',' && bracketLevel === 0) {
            paramsList.push(currentArg.trim());
            currentArg = '';
        } else {
            currentArg += char;

            if (char === '<') {
                bracketLevel++;
            } else if (char === '>') {
                bracketLevel--;
            }
        }
    }

    paramsList.push(currentArg.trim());
    for(let p of paramsList) {
        if(!p) continue;

        let isRequire = true;
        let name = '';
        let type = '';
        let isBase = true;
        let defaultValue = '-';
        if(p.includes('=')) {
            isRequire = false;
            [name, defaultValue] = p.split('=');
            type = getTypeByText(defaultValue.trim());
        }else if(p.includes(':')) {
            if(p.includes('?')) {
                isRequire = false;
                p = p.replace('?', '');
            }
            const [_name, ...rest] = p.split(/[:=]/);
            name = _name;
            type = rest.join('');
        }else{
            name = p;
            type = null;
        }
        params.push({
            name: name && name.trim(),
            type: type && type.trim(),
            isBase: (isBase = isBaseType(type)),
            isRequire,
            defaultValue
        });
        if(!isBase && type) {
            useTypes.add(type.trim());
        }

    }
    return params;
};
//  根据function函数获取函数返回值列表
export const getReturns = (declaration: FunctionDeclaration, { typeChecker }, useTypes: Set<string>):Returns => {

    const returnTypeNode = declaration.getReturnTypeNode();
    let type = '';
    let isBase = true;
    if(returnTypeNode) {
        const returnType = typeChecker.getTypeAtLocation(returnTypeNode);
        type = returnType.getText();
        if(!isBaseType(type) && type) {
            useTypes.add(type.trim());
            isBase = false;
        }
    }
    return {
        type,
        isBase
    };
};

// 获取箭头函数返回值
export const getReturnsByVarible = (declaration: VariableStatement, useTypes: Set<string>): Returns => {
    const headerText: string = declaration.getText().split('\n')[0];
    const match = headerText.match(/\)\s?:(.*?)[{=>]/);
    if(!match) return null;
    let isBase = true;
    const type = match[1]?.trim();
    if(!isBaseType(type)) {
        useTypes.add(type);
        isBase = false;
    }
    return {
        type,
        isBase
    };
};