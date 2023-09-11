import { e1, fds } from './fds';
/** z=这是hh接口 */
interface hh{
    /** z=这是hh name */
    name:string
}
/** z=这是enum接口 */
enum Int{
    /** 这是enum age */
    age
}
/** z=这是type接口 */
type sd = Int | number
/**
 * 测试单行注释
 * @param as - 这是参数1
 * @param sdf - 这是参数2
 */
export default (as: e1, sdf:fds, s: sd, sd = new Date('2021-1-1')) =>{
    return '12';
};