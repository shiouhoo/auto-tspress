import { TypeDeclaration, TypeUnions } from '@/types';
import { Type, ts, InterfaceDeclaration, EnumDeclaration } from 'ts-morph';
import { tsMorph } from '@/global';
import { tsTypeIsRecord, isBooleanLiteral } from './typeCheck';
import { collectedTypeList } from '@/cache';
import { collectDoc, collectDocByTsDoc } from '../collect/collectDoc';

export const getRecordByTsType = (type: Type<ts.Type> | ts.Type): { key:string, recordType: TypeDeclaration} => {
    const typeChecker = tsMorph.typeChecker.compilerObject;
    if(type instanceof Type) {
        type = type.compilerType as ts.ObjectType;
    }
    const typeArguments = type.aliasTypeArguments;
    if (typeArguments && typeArguments.length > 1) {
        const keyType = typeArguments[0];
        const valueType = typeArguments[1];
        return {
            key: typeChecker.typeToString(keyType),
            recordType: getTypeByTsType(valueType)
        };
    }
    return null;
};
/** 数组第一项为declaration信息，其余的为依赖TypeDeclaration信息 */
export const getInterfaceDetailByDeclaration = (interfaceDeclaration: InterfaceDeclaration): [{
    [key:string]: {
        value: TypeUnions,
        isRequire: boolean,
        isIndexSignature: boolean,
        link?: string,
        doc: Record<string, string[][]>
    }
}, TypeDeclaration[]] => {
    const result = {};
    for(const member of interfaceDeclaration.getProperties()) {
        result[member.getName()] = {
            value: member.getTypeNode()?.getText(),
            isRequire: !member.hasQuestionToken(),
            isIndexSignature: false,
            doc: collectDoc(member.getJsDocs()[0])
        };
    }
    // 获取索引签名
    const indexSignature = interfaceDeclaration.getIndexSignatures()[0];
    if(indexSignature) {
        result[indexSignature.getType().getText()] = {
            value: indexSignature.getReturnType().getText(),
            isRequire: false,
            isIndexSignature: true,
            doc: collectDoc(indexSignature.getJsDocs()[0])
        };
    }
    return [result, []];
};

export const getDetailTsInterface = (interfaceDeclaration: ts.InterfaceDeclaration): {
    [key:string]: {
        value: TypeUnions,
        isRequire: boolean,
        isIndexSignature: boolean,
        doc: Record<string, string[][]>
    }
} => {
    const result = {};
    for(const member of interfaceDeclaration.members) {
        let doc: any = member.getChildren()[0] as ts.JSDoc;
        if(doc.kind === ts.SyntaxKind.JSDoc) {
            doc = collectDocByTsDoc(doc);
        }else{
            doc = null;
        }
        if(ts.isPropertySignature(member)) {
            result[member.name.getText()] = {
                value: member.type.getText(),
                isIndexSignature: false,
                isRequire: !member.questionToken,
                doc
            };
        }else if(ts.isIndexSignatureDeclaration(member)) {
            result[member.parameters[0].type.getText()] = {
                value: member.type.getText(),
                isIndexSignature: true,
                isRequire: true,
                doc
            };
        }
    }
    return result;
};

export const getTypeByMorphType = (paramType: Type<ts.Type>): {
    type: TypeDeclaration,
    dep: TypeDeclaration[]
} => {
    // 从缓存中获取类型对象
    const value = paramType.getText().startsWith('import') ? paramType.getText().split('.')[1] : paramType.getText();
    const path = paramType.getText().startsWith('import') ? paramType.getText().split('.')[0].slice(7, -1) : tsMorph.sourchFile.getFilePath();
    const tmp = collectedTypeList.get(path, value);
    if(tmp) {
        return {
            type: tmp,
            dep: []
        };
    }
    const type: TypeDeclaration = {
        value,
        type: 'any'
    };

    if(paramType.isString()) {
        type.type = 'string';
    }else if(paramType.isNumber()) {
        type.type = 'number';
    }else if(paramType.isBoolean()) {
        type.type = 'boolean';
    }else if (paramType.isArray()) {
        type.type = 'array';
        const typeArguments = paramType.getTypeArguments();
        if (typeArguments.length > 0) {
            const elementType = typeArguments[0];
            console.log(`Array element type: ${elementType.getText()}`);
        }
    // Record类型
    }else if (tsTypeIsRecord(paramType)) {
        type.type = 'record';
        const { key, recordType } = getRecordByTsType(paramType);
        type.recordDetail = {
            key,
            value: recordType
        };
    }else if(paramType.isInterface()) {
        type.type = 'interface';
        const interfaceType = paramType.compilerType;

        // 是否导出
        const symbol = interfaceType.getSymbol();
        type.isGlobal = !!symbol?.exports;
        // 获取interface键值
        type.interfaceDetail = {};
        const declaration = interfaceType.getSymbol().declarations[0] as ts.InterfaceDeclaration;
        type.interfaceDetail = getDetailTsInterface(declaration);

        // 保存已经解析的类型
        collectedTypeList.add(path, value, type);
        type.filePath = path;

    }
    return {
        type,
        dep: []
    };
};

export const getTypeByTsType = (paramType: ts.Type): TypeDeclaration => {
    const typeChecker = tsMorph.typeChecker.compilerObject;
    const type: TypeDeclaration = {
        value: typeChecker.typeToString(paramType),
        type: 'any'
    };

    if(paramType.isStringLiteral()) {
        type.type = 'string';
    }else if(paramType.isNumberLiteral()) {
        type.type = 'number';
    }else if(isBooleanLiteral(paramType)) {
        type.type = 'boolean';
    // }else if (paramType.isArray()) {
    //     type.type = 'array';
    //     const typeArguments = paramType.getTypeArguments();
    //     if (typeArguments.length > 0) {
    //         const elementType = typeArguments[0];
    //         console.log(`Array element type: ${elementType.getText()}`);
    //     }
    // Record类型
    }else if (tsTypeIsRecord(paramType)) {
        type.type = 'record';
        const { key, recordType } = getRecordByTsType(paramType);
        type.recordDetail = {
            key,
            value: recordType
        };
    }
    // }else if(paramType.isInterface()) {
    //     console.log('i');
    // }
    return type;
};

/** 获取enum类型 */
export const getEnumDetailByDeclaration = (namedExport: EnumDeclaration)=>{
    const typeObject = {};
    for(const member of namedExport.getMembers()) {
        typeObject[member.getName()] = {
            value: member.getValue() + '',
            isRequire: true,
            // doc: collectDoc(member.getJsDocs()[0])
        };
    }
    return Object.keys(typeObject).length ? typeObject : null;
};