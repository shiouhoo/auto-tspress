import { lineSysbol } from '@/global';
import { VariableStatement, FunctionDeclaration } from 'ts-morph';
import { Returns } from '@/types';
import { isBaseType } from '../type/typeParse';

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