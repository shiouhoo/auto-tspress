import { TypeDeclaration } from './types';
import { TypeObject } from './types/entity';
import { shouldPushTypeList } from './utils/type/typeCheck';

class CollectedTypeList {
    collectedTypeList: TypeObject[];
    constructor() {
        this.collectedTypeList = [];
    }

    addTypeObject(typeObject: TypeObject) {
        if(!shouldPushTypeList(typeObject.type)) return;
        if(!this.collectedTypeList.some((item)=> item.type.value === typeObject.type.value && item.type.filePath === typeObject.type.filePath)) {
            this.collectedTypeList.push(typeObject);
        }
    }

    add(value: string, path: string, type: TypeDeclaration, deps: TypeDeclaration[]) {
        if(!this.collectedTypeList.some((item)=> item.type.value === value && item.type.filePath === path)) {
            const typeObject = new TypeObject(type, deps);
            this.collectedTypeList.push(typeObject);
        }
    }

    get(path:string, value: string) {
        return this.collectedTypeList.find((item)=> item.type.value === value && item.type.filePath === path);
    }
}

export const collectedTypeList = new CollectedTypeList();