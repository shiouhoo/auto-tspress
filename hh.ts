import { e1, fds } from './fds';
/** z=这是hh接口 */
interface hh{
    name:string
}
/** z=这是enum接口 */
enum Int{
    age
}
/** z=这是type接口 */
type sd = Int | number
/**
 * 测试单行注释
 * @param as - 这是参数1
 * @param sdf - 这是参数2
 */
export const test = (as: hh, sdf:Int, s: sd, sd = new Date('2021-1-1')) =>{

};
/**
 *  @description 这是测试函数
 * @param as 这是参数1
 * @param sdf 这是参数2
 */
export function test2(as: hh, sdf:Int, s: sd, sd = new Date('2021-1-1')) {

}