import { Node, ExportedDeclarations } from 'ts-morph';

// 判断是否是函数
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