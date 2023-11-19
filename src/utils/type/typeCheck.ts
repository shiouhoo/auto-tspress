import { Type, ts } from 'ts-morph';
import { tsMorph } from '@/global';

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