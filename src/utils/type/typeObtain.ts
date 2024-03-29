import { TypeDeclaration, InterfaceDetail, TypeUnions } from '@/types';
import { Type, ts, InterfaceDeclaration } from 'ts-morph';
import { tsMorph } from '@/global';
import { tsTypeIsRecord, getPushTypeList } from './typeCheck';
import { collectedTypeList } from '@/cache';
import { collectDoc, collectDocByTsDoc, collectDocByTsType } from '../collect/collectDoc';
import { TypeObject } from '@/types/entity';
import { filterTypeList, getAliasValueByNode, getValuePath } from './typeParse';
import { log } from '@/log';

/** 获取Record类型 */
export const getRecordByTsType = (type: ts.Type): {
    key:string, value: TypeDeclaration, deps: TypeDeclaration[]
} => {
    const typeChecker = tsMorph.typeChecker.compilerObject;

    const result = {
        key: '',
        value: {} as TypeDeclaration,
        deps: [] as TypeDeclaration[]
    };

    const typeArguments = type.aliasTypeArguments;
    if (typeArguments && typeArguments.length > 1) {
        const keyType = typeArguments[0];
        const valueType = typeArguments[1];
        result.key = typeChecker.typeToString(keyType);
        const { type: value, deps } = getTypeByTsType(valueType);
        result.value = value;
        result.deps.push(...getPushTypeList(value, deps));
    }
    return result;
};
/** 根据InterfaceDeclaration获取接口详情 */
export const getInterfaceDetailByDeclaration = (interfaceDeclaration: InterfaceDeclaration): {detail: InterfaceDetail, deps: TypeDeclaration[]} => {
    const result = {
        detail: {} as InterfaceDetail,
        deps: [] as TypeDeclaration[]
    };
    for(const member of interfaceDeclaration.getProperties()) {

        const typeNode = tsMorph.typeChecker.getTypeAtLocation(member);
        const { type, deps } = getTypeByMorphType(typeNode);
        result.deps.push(...getPushTypeList(type, deps));
        result.detail[member.getName()] = {
            value: (member.getTypeNode()?.getText() || '') as TypeUnions,
            isRequire: !member.hasQuestionToken(),
            isIndexSignature: false,
            doc: collectDoc(member.getJsDocs()[0])
        };
    }
    // 获取索引签名
    const indexSignature = interfaceDeclaration.getIndexSignatures()[0];
    if(indexSignature) {

        const typeNode = tsMorph.typeChecker.getTypeAtLocation(indexSignature);
        const { type, deps } = getTypeByMorphType(typeNode);
        result.deps.push(...getPushTypeList(type, deps));

        result.detail[indexSignature.getType().getText()] = {
            value: (indexSignature.getReturnType().getText() || '') as TypeUnions,
            isRequire: false,
            isIndexSignature: true,
            doc: collectDoc(indexSignature.getJsDocs()[0])
        };
    }
    return result;
};
/** 根据ts内置类型获取接口详情 */
export const getDetailTsInterface = (interfaceDeclaration: ts.InterfaceDeclaration): {detail: InterfaceDetail, deps: TypeDeclaration[]} => {
    const result = {
        detail: {} as InterfaceDetail,
        deps: [] as TypeDeclaration[]
    };
    for(const member of interfaceDeclaration.members) {
        // TODO 一般来说是第一个子节点，但是有可能不是JSDoc
        let doc: any = member.getChildren()[0] as ts.JSDoc;
        if(doc.kind === ts.SyntaxKind.JSDoc) {
            doc = collectDocByTsDoc(doc);
        }else{
            doc = null;
        }
        if(ts.isPropertySignature(member) || ts.isIndexSignatureDeclaration(member)) {
            const typeNode = tsMorph.typeChecker.compilerObject.getTypeAtLocation(member.type!);
            const { type, deps } = getTypeByTsType(typeNode);
            result.deps.push(...getPushTypeList(type, deps));

        }
        if(ts.isPropertySignature(member)) {
            result.detail[member.name.getText()] = {
                value: (member.type?.getText() || '') as TypeUnions,
                isIndexSignature: false,
                isRequire: !member.questionToken,
                doc
            };
        }else if(ts.isIndexSignatureDeclaration(member)) {
            result.detail[member.parameters[0].type?.getText() || ''] = {
                value: (member.type?.getText() || '') as TypeUnions,
                isIndexSignature: true,
                isRequire: true,
                doc
            };
        }
    }
    return result;
};
/** 获取类型 */
export const getTypeByMorphType = (paramType: Type<ts.Type>): {
    type: TypeDeclaration,
    deps: TypeDeclaration[]
} => {
    const value = tsMorph.typeChecker.compilerObject.typeToString(paramType.compilerType);
    const { path } = getValuePath(paramType.getText());
    // 从缓存中获取类型对象
    const tmp = collectedTypeList.get(path, value);
    if(tmp) {
        return tmp;
    }

    const result = new TypeObject({} as TypeDeclaration, []);

    let type: TypeDeclaration = {
        value,
        type: 'any',
        filePath: path
    };

    if(!path.includes('node_modules')) {

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
                const { type: itemType, deps } = getTypeByMorphType(elementType);
                type.arrayDetail = itemType;
                result.deps.push(...getPushTypeList(itemType, deps));
            }
            // Record类型
        }else if (tsTypeIsRecord(paramType)) {
            type.type = 'record';
            const recordType = paramType.compilerType;
            const { key, value: itemType, deps } = getRecordByTsType(recordType);
            type.recordDetail = {
                key,
                value: itemType
            };
            result.deps.push(...getPushTypeList(itemType, deps));
        }else if(paramType.isInterface()) {
            type.type = 'interface';
            const interfaceType = paramType.compilerType;
            // 获取interface键值
            const declaration = interfaceType.getSymbol()?.declarations?.[0] as ts.InterfaceDeclaration;
            type.docs = collectDocByTsType(declaration);
            const { detail, deps } = getDetailTsInterface(declaration);
            type.interfaceDetail = detail;
            result.deps.push(...filterTypeList(deps));

        }else if (paramType.isEnum() || paramType.isEnumLiteral()) {
            type.type = 'enum';
            const declaration = paramType.compilerType.getSymbol()?.declarations?.[0] as ts.EnumDeclaration;
            let enumDeclaration = declaration;
            if (ts.isEnumMember(declaration)) {
                enumDeclaration = (declaration as ts.EnumMember).parent;
            }
            type.docs = collectDocByTsType(enumDeclaration);
            const { detail } = getEnumDetailByDeclaration(enumDeclaration);
            type.interfaceDetail = detail;
        }else if (paramType.isUnion() || paramType.isIntersection()) {
            type.type = paramType.isUnion() ? 'union' : 'intersection';
            const declaration = paramType.compilerType as ts.UnionType;
            const { unionList, deps } = paramType.isUnion() ? getUnionDetailByTsType(declaration) : getIntersectionDetailByTsType(declaration);
            type.unionList = unionList;
            result.deps.push(...filterTypeList(deps));
        }
        // 别名会被其他类型识别成功，所以需要放在最后
        if(paramType.getAliasSymbol() !== undefined) {
            // 获取别名的类型
            const aliasDeclaration = paramType.compilerType.symbol.declarations?.[0] as ts.TypeAliasDeclaration;
            const { value, typeValue } = getAliasValueByNode(aliasDeclaration);
            const { detail, deps } = getTypeDetailByDeclaration(aliasDeclaration!);
            result.deps.push(...filterTypeList(deps));
            type = {
                value,
                typeValue,
                type: 'type',
                filePath: path,
                typeDetail: detail
            };
        }
    }else{
        type.type = 'module';
    }

    result.type = type;
    collectedTypeList.addTypeObject(result);
    return result;
};

/** 根据ts内置类型获取类型 */
export const getTypeByTsType = (paramType: ts.Type): {
    type: TypeDeclaration,
    deps: TypeDeclaration[]
} => {

    const typeChecker = tsMorph.typeChecker.compilerObject;
    const typeFlags = paramType.flags;
    /** 类型字面量 */
    let value = typeChecker.typeToString(paramType);
    const { value: typeValue, path } = getValuePath(value);

    // 从缓存中获取类型对象
    const tmp = collectedTypeList.get(path, typeValue);
    if(tmp) {
        return tmp;
    }
    const result = new TypeObject({} as TypeDeclaration, []);
    let type: TypeDeclaration = {
        value: typeValue,
        type: 'any',
        filePath: path
    };
    if(path.includes('node_modules')) {
        type.type = 'module';
    }else{

        if(typeFlags & ts.TypeFlags.StringLiteral || typeFlags & ts.TypeFlags.String) {
            type.type = 'string';
        }else if(typeFlags & ts.TypeFlags.NumberLiteral || typeFlags & ts.TypeFlags.Number) {
            type.type = 'number';
        }else if(typeFlags & ts.TypeFlags.BooleanLiteral || typeFlags & ts.TypeFlags.Boolean) {
            type.type = 'boolean';
        }else if (typeChecker.isArrayType(paramType)) {
            type.type = 'array';
            const typeArguments = typeChecker.getTypeArguments(paramType as ts.TypeReference);
            if (typeArguments.length > 0) {
                const elementType = typeArguments[0];
                const { type: itemType, deps } = getTypeByTsType(elementType);
                type.arrayDetail = itemType;
                result.deps.push(...getPushTypeList(itemType, deps));
            }
        }else if (value.startsWith('Record<')) {
            type.type = 'record';
            const { key, value: itemType, deps } = getRecordByTsType(paramType);
            type.recordDetail = {
                key,
                value: itemType
            };
            result.deps.push(...getPushTypeList(itemType, deps));
        }else if((typeFlags & ts.TypeFlags.Union) || (typeFlags & ts.TypeFlags.Intersection)) {
            const isUnion = typeFlags & ts.TypeFlags.Union;
            type.type = isUnion ? 'union' : 'intersection';
            const { unionList, deps } = isUnion ? getUnionDetailByTsType(paramType as ts.UnionType) : getIntersectionDetailByTsType(paramType as ts.IntersectionType);
            type.unionList = unionList;
            result.deps.push(...filterTypeList(deps));
        }else if (paramType.isClassOrInterface()) {
        // 获取interfaceDeclaration
            const declaration = paramType.getSymbol()?.getDeclarations()?.[0];
            if(declaration && ts.isInterfaceDeclaration(declaration)) {
                type.type = 'interface';
                type.docs = collectDocByTsType(declaration);
                const { detail, deps } = getDetailTsInterface(declaration);
                type.interfaceDetail = detail;
                result.deps.push(...filterTypeList(deps));
            }
        }else if(typeFlags & ts.SymbolFlags.TypeAlias) {
            // 获取别名的类型
            const aliasDeclaration = paramType.symbol.declarations?.[0] as ts.TypeAliasDeclaration;
            const { detail, deps } = getTypeDetailByDeclaration(aliasDeclaration);
            result.deps.push(...filterTypeList(deps));
            const { typeValue } = getAliasValueByNode(aliasDeclaration);
            type = {
                ...type,
                typeValue,
                type: 'type',
                filePath: path,
                typeDetail: detail
            };
        }
        if (typeFlags & ts.TypeFlags.EnumLike || typeFlags & ts.TypeFlags.EnumLiteral) {
            if(value.includes('.')) {
                value = value.split('.')[0];
                type.value = value;
            }
            paramType = paramType as ts.EnumType;
            type.type = 'enum';
            const declaration = paramType.getSymbol()?.declarations?.[0] as ts.EnumDeclaration;
            type.docs = collectDocByTsType(declaration);
            const { detail } = getEnumDetailByDeclaration(declaration);
            type.interfaceDetail = detail;
        }
    }

    result.type = type;
    collectedTypeList.addTypeObject(result);
    return result;
};

/** 获取enum类型 */
export const getEnumDetailByDeclaration = (enumDeclaration: ts.EnumDeclaration): {detail: InterfaceDetail, deps: TypeDeclaration[]} =>{
    const result = {
        detail: {} as InterfaceDetail,
        deps: [] as TypeDeclaration[]
    };
    // 当枚举个数只有一个时，需要获取父级枚举
    for(const member of enumDeclaration.members || (enumDeclaration?.parent as ts.EnumDeclaration)?.members || []) {
        let doc: any = member.getChildren()[0] as ts.JSDoc;
        if(doc.kind === ts.SyntaxKind.JSDoc) {
            doc = collectDocByTsDoc(doc);
        }else{
            doc = null;
        }
        const name = (member.name as any).text;
        if(!name) {
            log.logDebug(`获取枚举成员异常`, enumDeclaration.name.text);
            continue;
        }
        // TODO 枚举值不考虑复合类型
        result.detail[member.name.getText()] = {
            value: (member?.initializer?.getText() || '') as TypeUnions,
            isIndexSignature: false,
            isRequire: true,
            doc
        };
    }
    return result;
};

/** 获取union类型 */
export const getUnionDetailByTsType = (unionType: ts.UnionType): {unionList: TypeDeclaration[], deps: TypeDeclaration[]} =>{
    const result = {
        unionList: [] as TypeDeclaration[],
        deps: [] as TypeDeclaration[]
    };
    // 当联合类型有枚举时，会把每一个枚举值都当做一个联合类型
    for(const type of unionType?.types || []) {
        const { type: unionItem, deps } = getTypeByTsType(type);
        result.unionList.push(unionItem);
        result.deps.push(...getPushTypeList(unionItem, deps));
    }
    return result;
};

/** 获取intersection类型 */
export const getIntersectionDetailByTsType = (intersectionType: ts.IntersectionType): {unionList: TypeDeclaration[], deps: TypeDeclaration[]} =>{
    const result = {
        unionList: [] as TypeDeclaration[],
        deps: [] as TypeDeclaration[]
    };
    for(const type of intersectionType?.types || []) {
        const { type: unionItem, deps } = getTypeByTsType(type);
        result.unionList.push(unionItem);
        result.deps.push(...getPushTypeList(unionItem, deps));
    }
    return result;
};

/** 根据ts内置类型获取type详情 */
export const getTypeDetailByDeclaration = (objectType: ts.Declaration): {detail: TypeDeclaration, deps: TypeDeclaration[]} =>{
    const { value } = getAliasValueByNode(objectType);
    const result = {
        detail: {
            value,
            type: 'any' as TypeUnions,
            interfaceDetail: {} as InterfaceDetail,
        },
        deps: [] as TypeDeclaration[]
    };
    const objectDeclaration = objectType;
    if(objectDeclaration.kind === ts.SyntaxKind.TypeLiteral) {
        result.detail.type = 'type';
        for(const member of (objectDeclaration as any)?.members || []) {
            if(ts.isPropertySignature(member)) {
                let doc: any = member.getChildren()[0] as ts.JSDoc;
                if(doc.kind === ts.SyntaxKind.JSDoc) {
                    doc = collectDocByTsDoc(doc);
                }else{
                    doc = null;
                }

                const typeNode = tsMorph.typeChecker.compilerObject.getTypeAtLocation(member.type!);
                const { type, deps } = getTypeByTsType(typeNode);
                result.deps.push(...getPushTypeList(type, deps));

                result.detail.interfaceDetail[member.name.getText()] = {
                    value: (member.type?.getText() || '') as TypeUnions,
                    isIndexSignature: false,
                    doc,
                    isRequire: !member.questionToken,
                };

            }
        }
    }
    return result;
};