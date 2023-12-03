import { FunctionDeclaration, VariableDeclaration, Node } from 'ts-morph';
import { FunctionItem, TypeDeclaration } from '@/types';
import { getParamsList } from './collectParams';
import { getReturns } from './collectReturns';
import { filterTypeList } from '../type/typeParse';
import { collectDoc } from './collectDoc';

// 收集函数
export function collectFunction(functionDeclaration: FunctionDeclaration | VariableDeclaration): [FunctionItem, TypeDeclaration[]] {

    const { paramsList, typeList } = getParamsList(functionDeclaration);
    const { returns, typeList: typeList1 } = getReturns(functionDeclaration);

    let jsDocs;
    if (Node.isFunctionDeclaration(functionDeclaration)) {
        jsDocs = functionDeclaration.getJsDocs()[0];
    } else if (Node.isVariableDeclaration(functionDeclaration)) {
        const initializer = functionDeclaration.getInitializer();
        if (initializer && (Node.isArrowFunction(initializer) || Node.isFunctionExpression(initializer))) {
            // 获取变量声明的父节点
            const parent = functionDeclaration?.getParent()?.getParent();
            if (Node.isVariableStatement(parent)) {
            // 获取变量声明的 JSDoc 注释
                jsDocs = parent.getJsDocs()[0];
            }
        }
    }

    return [{
        name: functionDeclaration.getName() || '',
        params: paramsList,
        returns,
        docs: jsDocs ? collectDoc(jsDocs) : undefined,
        // 默认导出是，名称为undefined
        classify: functionDeclaration.getName()?.startsWith('use') ? 'hooks' : 'utils',
    }, filterTypeList([...typeList, ...typeList1])];
}