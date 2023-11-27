import { tsMorph } from '@/global';
import { TypeDeclaration } from '../../types';

/** 过滤重复的类型 */
export const filterTypeList = (typeList: TypeDeclaration[]) => {
    const map = {};
    return typeList.filter((item)=> {
        if(!map[item.value + item.filePath]) {
            map[item.value + item.filePath] = true;
            return true;
        }
        return false;
    });
};

/**
 * 获取类型的value和filePath
 * @param type 类型
 * @returns {
 *  value: 类型字面量,
 *  path: 类型定义路径
 * }
 */
export const getValuePath = (type: string) => {
    const value = type.startsWith('import') ? type.split(').')[1] : type;
    // 取导入的路径，否则就是定义在当前文件
    let path = type.startsWith('import') ? type.split(').')[0].slice(8, -1) : tsMorph.sourchFile.getFilePath();
    if(!path.endsWith('.ts')) {
        path += '.ts';
    }
    return {
        path,
        value,

    };
};