import { lineSysbol } from '@/global';
import { FunctionDeclaration, VariableStatement } from 'ts-morph';
import { Params } from '@/types';
import { getTypeByText, isBaseType } from '../type/typeParse';
import { splitFirstChar } from '../stringUtil';

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
            // 用第一个：分割参数和类型
            [name, type] = splitFirstChar(p, ':');
            // 类型为：x.y   x为文件名
            if(type.includes('.')) isAsImport = true;
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
