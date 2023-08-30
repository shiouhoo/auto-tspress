import { FunctionDeclaration, VariableStatement } from 'ts-morph';
import { Params, Returns } from './../types/index';
import { isBaseType } from './typeCheck';

// 判断是否是函数
export const varibleIsFunction = (variable: VariableStatement) => {
    const test = variable.getText().split('\n')[0];
    return test.indexOf('=>') > -1 || test.indexOf('function') > -1;
};

// 获取function参数列表
export const getParamsList = (declaration: FunctionDeclaration, useTypes:string[]) => {
    const params: Params = [];
    for (const param of declaration.getParameters()) {
        const data = {
            name: param.getName(),
            type: param.getType().getText(),
            isBase: isBaseType(param.getType().getText().trim()),
            isRequire: param.hasQuestionToken()
        };
        params.push(data);
        if(!data.isBase) {
            useTypes.push(data.type);
        }
    }
    return params;
};

// 获取箭头函数参数列表
export const getParamsListByVarible = (declaration: VariableStatement, useTypes:string[]) => {
    const params: Params = [];
    const headerText: string = declaration.getText().split('\n')[0];
    const paramsList: string[] = headerText.match(/\((.*)\)/)[1].split(',');
    for(let p of paramsList) {
        if(!p) continue;

        let isRequire = true;
        let name = '';
        let type = '';
        let isBase = true;
        if(p.includes('=')) {
            if(p.includes('?')) {
                isRequire = false;
                p = p.replace('?', '');
            }
            [name, type] = p.split('=');
        }else if(p.includes(':')) {
            const [_name, ...rest] = p.split(/[:=]/);
            name = _name;
            type = rest.join('');
        }else{
            name = p.trim();
            type = null;
        }
        params.push({
            name,
            type,
            isBase: (isBase = isBaseType(type)),
            isRequire
        });
        if(!isBase) {
            useTypes.push(type);
        }

    }
    return params;
};
//  根据function函数获取函数返回值列表
export const getReturns = (declaration: FunctionDeclaration, { typeChecker }, useTypes:string[]):Returns => {

    const returnTypeNode = declaration.getReturnTypeNode();
    let type = '';
    let isBase = true;
    if(returnTypeNode) {
        const returnType = typeChecker.getTypeAtLocation(returnTypeNode);
        type = returnType.getText();
        if(!isBaseType(type)) {
            useTypes.push(type);
            isBase = false;
        }
    }
    return {
        type,
        isBase
    };
};

// 获取箭头函数返回值
export const getReturnsByVarible = (declaration: VariableStatement, useTypes:string[]): Returns => {
    const headerText: string = declaration.getText().split('\n')[0];
    const match = headerText.match(/\)\s?:(.*?)[{=>]/);
    if(!match) return null;
    let isBase = true;
    const type = match[1].trim();
    if(!isBaseType(type)) {
        useTypes.push(type);
        isBase = false;
    }
    return {
        type,
        isBase
    };
};