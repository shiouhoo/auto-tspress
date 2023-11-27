import { TypeDeclaration } from '.';

/** 类型对象以及他依赖 */
export class TypeObject {

    type: TypeDeclaration;
    deps: TypeDeclaration[];

    constructor(type: TypeDeclaration, deps: TypeDeclaration[]) {
        this.type = type;
        this.deps = deps;
    }

}