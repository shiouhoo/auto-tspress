import { VariableStatement, Node, ExportedDeclarations } from 'ts-morph';
import { lineSysbol } from '@/global';

// 判断是否是函数
export const varibleIsFunction = (variable: VariableStatement | string) => {
    const test = typeof variable === 'string' ? variable : variable.getText().split(lineSysbol)[0];
    return test.indexOf('=>') > -1 || test.indexOf('function') > -1;
};

export const judgeExportedDeclarationsIsFunction = (declaration: ExportedDeclarations)=>{
    if (Node.isFunctionDeclaration(declaration)) {
        return true;
    } else if (Node.isVariableDeclaration(declaration)) {
        const initializer = declaration.getInitializer();
        if (initializer && (Node.isArrowFunction(initializer) || Node.isFunctionExpression(initializer))) {
            return true;
        }
    }
    return false;
};