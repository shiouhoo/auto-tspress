import { lineSysbol } from '@/global';
import { VariableStatement, FunctionDeclaration } from 'ts-morph';
import { Returns } from '@/types';
import { isBaseType } from '../type/typeParse';

// 获取箭头函数返回值
export const getReturns = (declaration: VariableStatement | FunctionDeclaration, useTypes: Set<string>): Returns => {
    const headerText: string = declaration.getText().split(lineSysbol)[0];
    let match = headerText.match(/\)\s?:(.*?)=>\s*{\s*$/);
    match ||= headerText.match(/function\s?.*\(.*?\)\s*?(.*?)\s*{\s*$/);
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