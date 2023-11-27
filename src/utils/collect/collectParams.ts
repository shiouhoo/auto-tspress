import { FunctionDeclaration, Type, VariableDeclaration, ts, Node, ParameterDeclaration } from 'ts-morph';
import { Params, TypeDeclaration } from '@/types';
import { getTypeByMorphType } from '@/utils/type/typeObtain';
import { getPushTypeList } from '@/utils/type/typeCheck';

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
};
