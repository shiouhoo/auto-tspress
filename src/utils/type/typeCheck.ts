import { Type, ts } from 'ts-morph';
import { TypeDeclaration } from '@/types';

/** 获取类型的symbol类型 */
const getAliasSymbol = (type: Type<ts.Type> | ts.Type): ts.Symbol | undefined => {
    let symbol: ts.Symbol | undefined;
    if(type instanceof Type) {
        const objectType = type.compilerType as ts.ObjectType;
        symbol = objectType.aliasSymbol;
    }else {
        symbol = type.aliasSymbol;
    }
    return symbol;
};

/**
 * 判断类型是否是Record
 * @param type
 * @returns boolean
 */
export const tsTypeIsRecord = (type: Type<ts.Type> | ts.Type) => {
    const symbol = getAliasSymbol(type);
    if (symbol && symbol.getName() === 'Record') {
        if(type instanceof Type) {
            type = type.compilerType;
        }
        const typeArguments = type.aliasTypeArguments;
        if (typeArguments && typeArguments.length > 1) {
            return true;
        }
    }
    return false;
};

/** 是否应该加入类型列表解析 */
export const shouldPushTypeList = (type: TypeDeclaration) : boolean =>{
    return ['interface', 'enum', 'record', 'union', 'intersection', 'type', 'module'].includes(type.type) || ('array' === type.type && shouldPushTypeList(type.arrayDetail!));
};

/** 是否应该加入依赖数组 */
export const shouldPushDeps = (type: TypeDeclaration)=>{
    return ['interface', 'enum', 'type'].includes(type.type);
};
/** 根据类型声明以及依赖获取解析的类型列表 */
export const getPushTypeList = (type: TypeDeclaration, deps: TypeDeclaration[]) => {
    const result: TypeDeclaration [] = [];
    if(shouldPushTypeList(type)) {
        if(type.type === 'array') {
            result.push(type.arrayDetail!);
        }
        // 以下类型本身不需要push到typeList
        if(!['record', 'union', 'intersection'].includes(type.type)) {
            result.push(type);
        }
        if('union' === type.type || 'intersection' === type.type) {
            result.push(...type.unionList!.reduce((res, item) => {
                res.push(...getPushTypeList(item, [] as TypeDeclaration[]));
                return res;
            }, [] as TypeDeclaration[])
            );
        }
        result.push(...deps);
    }
    return result;
};