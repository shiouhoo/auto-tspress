import { e1, fds } from './fds';
interface hh{
    name:string
}

interface Int{
    age: number
}

/**
 * 测试单行注释
 * @description 这是测试函数
 * @param as - 这是参数1
 * @param sdf - 这是参数2
 */
export const test = (as: hh, sdf:Int, s = e1.nan, sd = new Date('2021-1-1')) =>{

};
/**
 *  @description 这是测试函数
 * @param as 这是参数1
 * @param sdf 这是参数2
 */
export function test2(as: hh, sdf:Int, s = e1.nan, sd = new Date('2021-1-1')) {

}