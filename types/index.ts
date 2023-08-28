export interface TypeObject {
    isInterface: boolean
    target: string
    type: Record<string, TypeObject | string>
}

export type TypeItem = TypeObject | string

/** 参数类型 */
export type Params = {
    name: string
    type: TypeItem
}[]

/** 返回值类型 */
export type Returns = TypeItem

/** 一个文件的收集容器对象 */
export type FunctionMap = Record<string, {
    params: Params
    returns: Returns
    docs: Record<string, string[]>
}> | null
