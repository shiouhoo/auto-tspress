import { EnumDeclaration, InterfaceDeclaration, TypeAliasDeclaration } from 'ts-morph';
import { getEnumDetailByDeclaration, getInterfaceDetailByDeclaration, getTypeDetailByDeclaration } from '../type/typeObtain';
import { TypeDeclaration } from '@/types';
import { filterTypeList, getValuePath } from '../type/typeParse';
import { collectedTypeList } from '@/cache';
import { collectDoc } from './collectDoc';
import { splitFirstChar } from '../stringUtil';
import { TypeObject } from '@/types/entity';

/** 设置类型声明为全局 */
const setTypeGlobal = (type: TypeObject)=>{
    type.type.isGlobal = true;
    for(const dep of type.deps) {
        dep.isGlobal = true;
    }
};

/** 获取interafce */
export const collectInterface = (declaration: InterfaceDeclaration): {
    type: TypeDeclaration,
    deps: TypeDeclaration[]
}=>{

    const { value, path } = getValuePath(declaration.getName());
    const tmp = collectedTypeList.get(path, value);
    if(tmp) {
        setTypeGlobal(tmp);
        return tmp;
    }

    const { detail: interfaceDetail, deps } = getInterfaceDetailByDeclaration(declaration);
    return {
        type: {
            value: declaration.getName(),
            type: 'interface',
            filePath: path,
            interfaceDetail,
            docs: collectDoc(declaration.getJsDocs()[0])
        }, deps: filterTypeList(deps)
    };
};

/** 获取enum */
export const collectEnum = (declaration: EnumDeclaration): {
    type: TypeDeclaration,
    deps: TypeDeclaration[]
}=>{

    const { value, path } = getValuePath(declaration.getName());
    const tmp = collectedTypeList.get(path, value);
    if(tmp) {
        setTypeGlobal(tmp);
        return tmp;
    }

    const { detail, deps } = getEnumDetailByDeclaration(declaration.compilerNode);
    return {
        type: {
            value: declaration.getName(),
            type: 'enum',
            filePath: path,
            interfaceDetail: detail,
            docs: collectDoc(declaration.getJsDocs()[0])
        }, deps: filterTypeList(deps)
    };

};

/** 获取别名类型 */
export const collectType = (declaration: TypeAliasDeclaration): {
    type: TypeDeclaration,
    deps: TypeDeclaration[]
}=>{

    const { value, path } = getValuePath(declaration.getName());
    const tmp = collectedTypeList.get(path, value);
    if(tmp) {
        setTypeGlobal(tmp);
        return tmp;
    }

    const { detail, deps } = getTypeDetailByDeclaration(declaration.compilerNode);
    const aliasType = splitFirstChar(declaration.getText(), '=');
    return {
        type: {
            value: declaration.getName(),
            type: 'type',
            typeValue: aliasType[1] || '',
            filePath: path,
            typeDetail: detail,
            docs: collectDoc(declaration.getJsDocs()[0])
        },
        deps: filterTypeList(deps)
    };

};