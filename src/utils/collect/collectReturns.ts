import { getTypeByMorphType } from '@/utils/type/typeObtain';
import { FunctionDeclaration, Type, VariableDeclaration, ts, Node } from 'ts-morph';
import { Returns, TypeDeclaration } from '@/types';
import { getPushTypeList } from '@/utils/type/typeCheck';

// 获取函数返回值
export const getReturns = (
    declaration: FunctionDeclaration | VariableDeclaration) => {

    const returns: Returns = {
        value: '',
        type: 'any'
    };
    let returnType: Type<ts.Type> | undefined;
    const typeList: TypeDeclaration[] = [];

    if (Node.isVariableDeclaration(declaration)) {
        const initializer = declaration.getInitializer();
        if (initializer && (Node.isArrowFunction(initializer) || Node.isFunctionExpression(initializer))) {
            returnType = initializer.getReturnType();
        }
    }else{
        returnType = declaration.getReturnType();
    }

    if (returnType) {
        const { type, deps } = getTypeByMorphType(returnType);
        returns.type = type.type;
        returns.value = type.value;
        typeList.push(...getPushTypeList(type, deps));
    }
    return { returns, typeList };
};