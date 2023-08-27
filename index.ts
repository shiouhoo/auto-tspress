#!/usr/bin/env node
import { command } from './utils/command';
import { Project, SyntaxKind, FunctionDeclaration } from 'ts-morph';

const init = () => {
    const program = command();
    const project = new Project();
    const typeChecker = project.getTypeChecker();
    project.addSourceFilesAtPaths('./*.ts');
    const sourceFiles = project.getSourceFiles();
    const map: Record<string, any > = {};
    sourceFiles.forEach((sourceFile) => {
        const functionDeclarationMap: Record<string, any> = {};
        const exportDeclarations = sourceFile.getExportedDeclarations();
        for(const [declarationName, declarationArr] of exportDeclarations) {
            const declaration = declarationArr[0] as FunctionDeclaration;
            if (declaration.getKind() !== SyntaxKind.FunctionDeclaration) {
                return;
            }
            // 参数
            const params = [];
            for (const param of declaration.getParameters()) {
                const paramType = param.getType();
                if (paramType.isInterface()) {
                    const properties = paramType.getProperties();
                    const inter:Record<string, any> = {};
                    for (const property of properties) {
                        inter[property.getEscapedName()] = typeChecker.getTypeOfSymbolAtLocation(property, property.getValueDeclaration()!).getText();
                    }
                    params.push({
                        name: param.getName(),
                        type: {
                            isInterface: true,
                            type: inter
                        }
                    });
                }else{
                    params.push({
                        name: param.getName(),
                        type: param.getType().getText()
                    });
                }
            }
            // 返回值
            const returnTypeNode = declaration.getReturnTypeNode();
            let returns: Record<string, any> | null | string = null;
            if(returnTypeNode) {
                const returnType = typeChecker.getTypeAtLocation(returnTypeNode);

                if(returnType.isInterface()) {
                    const interfaceSymbol = returnType.getSymbol();
                    if (interfaceSymbol) {
                        const interfaceType = interfaceSymbol.getDeclaredType();
                        const properties = interfaceType.getProperties();
                        returns = {
                            isInterface: true,
                            type: {}
                        };
                        for (const property of properties) {
                            returns.type[property.getEscapedName()] = typeChecker.getTypeOfSymbolAtLocation(property, property.getValueDeclaration()!).getText();
                        }
                    }
                }else{
                    returns = returnType.getText();
                }
            }
            functionDeclarationMap[declarationName] = {
                params,
                returns
            };
            // tsDoc
            console.log(declaration.getJsDocs());
            map[sourceFile.getBaseName()] = functionDeclarationMap;
        }
    });
    console.log(JSON.stringify(map));
    program.parse(process.argv);

};

try{
    init();
}catch(err) {
    // eslint-disable-next-line no-console
    console.error(err);
}

