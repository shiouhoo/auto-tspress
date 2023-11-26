import { Type, ts } from 'ts-morph';
import { tsMorph } from '@/global';
import { TypeDeclaration } from '@/types';

const getAliasSymbol = (type: Type<ts.Type> | ts.Type): ts.Symbol => {
    let symbol: ts.Symbol = null;
    if(type instanceof Type) {
        const objectType = type.compilerType as ts.ObjectType;
        symbol = objectType.aliasSymbol;
    }else {
        symbol = type.aliasSymbol;
    }
    return symbol;
};

/**
 *
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

export function isBooleanLiteral(type: ts.Type): boolean {
    const typeChecker = tsMorph.typeChecker.compilerObject;
    const typeStr = typeChecker.typeToString(type);
    return typeStr === 'true' || typeStr === 'false' || typeStr === 'boolean';
}

export const shouldPushTypeList = (type: TypeDeclaration)=>{
    return ['interface', 'object', 'enum', 'record', 'union', 'intersection', 'type'].includes(type.type) || ('array' === type.type && shouldPushTypeList(type.arrayDetail));
};

export const shouldPushDeps = (type: TypeDeclaration)=>{
    return ['interface', 'enum', 'type'].includes(type.type);
};

export const getPushTypeList = (type: TypeDeclaration, deps: TypeDeclaration[]) => {
    const result = [];
    if(shouldPushTypeList(type)) {
        if(type.type === 'array') {
            result.push(type.arrayDetail);
        }
        // 以下类型本身不需要push到typeList
        if(!['record', 'union', 'intersection', 'object', 'type'].includes(type.type)) {
            result.push(type);
        }
        if('union' === type.type || 'intersection' === type.type) {
            result.push(...type.unionList);
        }
        result.push(...deps);
    }
    return result;
};