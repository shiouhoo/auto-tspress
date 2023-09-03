import { ExportedDeclarations } from 'ts-morph';
interface hh{
    name:string
}

interface Int{
    age: number
}

enum e1 {
    nan=10,
    nv=20
}

/**
 *  @description 这是测试函数
 * @param as 这是参数1
 * @param sdf 这是参数2
 */
export const test = (as: hh, sdf:Int, s: ExportedDeclarations, sd:e1) =>{

};
