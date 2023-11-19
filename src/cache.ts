import { TypeDeclaration } from './types';

class CollectedTypeList {
    collectedTypeList: TypeDeclaration[];
    constructor() {
        this.collectedTypeList = [];
    }

    add(path:string, value: string, type: TypeDeclaration) {
        if(!this.collectedTypeList.some((item)=> item.value === value && item.filePath === path)) {
            this.collectedTypeList.push({
                ...type,
                filePath: path
            });
        }
    }

    get(path:string, value: string) {
        return this.collectedTypeList.find((item)=> item.value === value && item.filePath === path);
    }
}

export const collectedTypeList = new CollectedTypeList();