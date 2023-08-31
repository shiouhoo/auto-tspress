/** 参数类型 */
export type Params = {
    name: string
    type: string
    isBase: boolean
    isRequire: boolean
}[]

/** 返回值类型 */
export type Returns = {
    type: string,
    isBase: boolean
}

/** 一个文件的收集容器对象 */
export type FunctionMap = Record<string, {
    params: Params
    returns: Returns
    docs: Record<string, string[][]>
}> | null

export interface TypeItem {
    type: 'interface' | 'type' | 'enum'
    value: Record<string, string> | string
}

export interface CollectMap {
    hooks: {
        types: Record<string, TypeItem>,
        value: Record<string, FunctionMap>,
    },
    utils: any,
    interfaces: any,
    /** 文件名：{
     *      类型名：{
     *          type: ''
     *      }
     * }
     *  */
    globalTypes: Record<string, Record<string, TypeItem>>
}