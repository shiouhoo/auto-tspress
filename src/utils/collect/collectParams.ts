// import { lineSysbol } from '@/global';
import { FunctionDeclaration, Type, VariableDeclaration, ts, Node, ParameterDeclaration } from 'ts-morph';
import { Params, TypeDeclaration } from '@/types';
import { getTypeByMorphType } from '@/utils/type/typeObtain';
import { getPushTypeList } from '@/utils/type/typeCheck';

// import { getTypeByText, isBaseType } from '../type/typeParse';
// import { splitFirstChar } from '../stringUtil';

// 获取函数参数列表
export const getParamsList = (
    declaration: FunctionDeclaration | VariableDeclaration) => {

    const paramsList: Params[] = [];
    const typeList: TypeDeclaration[] = [];
    let params: ParameterDeclaration[] = [];
    if (Node.isVariableDeclaration(declaration)) {
        const initializer = declaration.getInitializer();
        if (initializer && (Node.isArrowFunction(initializer) || Node.isFunctionExpression(initializer))) {
            params = initializer.getParameters();
        }
    }else{
        params = declaration.getParameters();
    }
    for (const param of params) {

        const paramItem: Params = {
            name: param.getName(),
            type: null,
            isRequire: !param.isOptional(),
            defaultValue: param.getInitializer() ? param.getInitializer().getText() : ''
        };

        const paramType: Type<ts.Type> = param.getType();
        const { type, deps } = getTypeByMorphType(paramType);
        paramItem.type = type.value;

        paramsList.push(paramItem);
        typeList.push(...getPushTypeList(type, deps));

    }
    return { paramsList, typeList };

    // const headerText: string = declaration.getText().split(lineSysbol)[0];
    // const paramsList: string[] = [];
    // const paramString = headerText.match(/\((.*)\)/)[1];
    // let currentArg = '';
    // let bracketLevel = 0;

    // for (let i = 0;i < paramString.length;i++) {
    //     const char = paramString[i];

    //     if (char === ',' && bracketLevel === 0) {
    //         paramsList.push(currentArg.trim());
    //         currentArg = '';
    //     } else {
    //         currentArg += char;

    //         if (char === '<' || char === '{') {
    //             bracketLevel++;
    //         } else if (char === '>' || char === '}') {
    //             bracketLevel--;
    //         }
    //     }
    // }
    // paramsList.push(currentArg.trim());

    // /** 记录是否import * as */
    // let isAsImport = false;
    // for(let p of paramsList) {
    //     if(!p) continue;

    //     let isRequire = true;
    //     let name = '';
    //     let type = '';
    //     let isBase = true;
    //     let defaultValue = '-';
    //     if(p.includes('=')) {
    //         isRequire = false;
    //         [name, defaultValue] = p.split('=');
    //         type = getTypeByText(defaultValue.trim(), 0);
    //     }else if(p.includes(':')) {
    //         if(p.includes('?')) {
    //             isRequire = false;
    //             p = p.replace('?', '');
    //         }
    //         // 用第一个：分割参数和类型
    //         [name, type] = splitFirstChar(p, ':');
    //         // 类型为：x.y   x为文件名
    //         if(type.includes('.')) isAsImport = true;
    //     }else{
    //         name = p;
    //         type = null;
    //     }
    //     params.push({
    //         name: name && name.trim(),
    //         // 处理 import * as
    //         type: type && (isAsImport ? getTypeByText(type, 1) : type).trim(),
    //         isBase: (isBase = isBaseType(type)),
    //         isRequire,
    //         defaultValue
    //     });
    //     if(!isBase && type) {
    //         useTypes.add(type);
    //     }
    // }
    // return paramsList;
};
