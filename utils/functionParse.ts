import { lineSysbol } from './../global';
import { FunctionDeclaration, VariableStatement } from 'ts-morph';
import { Params, Returns } from './../types/index';
import { isBaseType, getTypeByText } from './typeAction';

// 判断是否是函数
export const varibleIsFunction = (variable: VariableStatement) => {
    const test = variable.getText().split('\n')[0];
    return test.indexOf('=>') > -1 || test.indexOf('function') > -1;
};

// 获取function参数列表
export const getParamsList = (declaration: FunctionDeclaration, useTypes: Set<string>) => {
    return getParamsListByVarible(declaration, useTypes);
};

// 获取箭头函数参数列表
export const getParamsListByVarible = (declaration: VariableStatement | FunctionDeclaration, useTypes: Set<string>) => {
    const params: Params = [];
    const headerText: string = declaration.getText().split(lineSysbol)[0];
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
    /** 记录是否import * as */
    let isAsImport = false;
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
            type = getTypeByText(defaultValue.trim(), true);
        }else if(p.includes(':')) {
            if(p.includes('?')) {
                isRequire = false;
                p = p.replace('?', '');
            }
            const [_name, ...rest] = p.split(/[:=]/);
            name = _name;
            if(rest.join('').includes('.')) isAsImport = true;
            type = rest.join('');
        }else{
            name = p;
            type = null;
        }
        params.push({
            name: name && name.trim(),
            // 处理 import * as
            type: type && (isAsImport ? getTypeByText(type, false) : type).trim(),
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
    const headerText: string = declaration.getText().split(lineSysbol)[0];
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