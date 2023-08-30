import { FunctionDeclaration, VariableStatement } from 'ts-morph';
import { TypeObject, Params, Returns } from './../types/index';
import { isBaseType } from './typeCheck';

// 判断是否是函数
export const varibleIsFunction = (variable: VariableStatement) => {
    const test = variable.getText().split('\n')[0];
    return test.indexOf('=>') > -1 || test.indexOf('function') > -1;
};

// 获取function参数列表
export const getParamsList = (declaration: FunctionDeclaration, { typeChecker }) => {
    const params: Params = [];
    for (const param of declaration.getParameters()) {
        const paramType = param.getType();
        if (paramType.isInterface()) {
            const properties = paramType.getProperties();

            const inter:Record<string, TypeObject | string> = {};
            for (const property of properties) {
                inter[property.getEscapedName()] = typeChecker.getTypeOfSymbolAtLocation(property, property.getValueDeclaration()!).getText();
            }

            params.push({
                name: param.getName(),
                type: {
                    isInterface: true,
                    target: paramType.getText(),
                    type: inter
                }
            });
        }else{
            params.push({
                name: param.getName(),
                type: param.getType().getText()
            });
        }
    }
    return params;
};

// 获取箭头函数参数列表
export const getParamsListByVarible = (declaration: VariableStatement) => {
    const params: Params = [];
    const headerText: string = declaration.getText().split('\n')[0];
    const paramsList: string[] = headerText.match(/\((.*)\)/)[1].split(',');
    for(const p of paramsList) {
        if(!p) continue;
        const [name, type] = p.split(/[:=]/);
        if(isBaseType(type.trim())) {
            params.push({
                name: name.trim(),
                type
            });
        }
    }
    return params;
};
//  根据function函数获取函数返回值列表
export const getReturns = (declaration: FunctionDeclaration, { typeChecker }) => {

    const returnTypeNode = declaration.getReturnTypeNode();
    let returns: Returns = null;
    if(returnTypeNode) {
        const returnType = typeChecker.getTypeAtLocation(returnTypeNode);

        if(returnType.isInterface()) {
            const interfaceSymbol = returnType.getSymbol();
            if (interfaceSymbol) {
                const interfaceType = interfaceSymbol.getDeclaredType();
                const properties = interfaceType.getProperties();
                const p :Record<string, TypeObject | string> = {};
                for (const property of properties) {
                    p[property.getEscapedName()] = typeChecker.getTypeOfSymbolAtLocation(property, property.getValueDeclaration()!).getText();
                }
                returns = {
                    isInterface: true,
                    target: returnType.getText(),
                    type: p
                };

            }
        }else{
            returns = returnType.getText();
        }
    }
    return returns;
};

// 获取箭头函数返回值
export const getReturnsByVarible = (declaration: VariableStatement) => {
    let returns: Returns = null;
    const headerText: string = declaration.getText().split('\n')[0];
    const match = headerText.match(/\)\s?:(.*?)[{=>]/);
    if(!match) return returns;
    const type = match[1].trim();
    if(isBaseType(type)) {
        returns = type;
    }
    return returns;
};