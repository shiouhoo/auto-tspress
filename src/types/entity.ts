import { TypeDeclaration } from '.';

export class TypeObject {

    type: TypeDeclaration;
    deps: TypeDeclaration[];

    constructor(type: TypeDeclaration, deps: TypeDeclaration[]) {
        this.type = type;
        this.deps = deps;
    }

}