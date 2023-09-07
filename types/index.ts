/** 参数类型 */
export type Params = {
    name: string
    type: string
    isBase: boolean
    isRequire: boolean
    defaultValue?: string
}[]

/** 返回值类型 */
export type Returns = {
    type: string,
    isBase: boolean
}

/** 一个函数的收集容器对象 */
export type FunctionMap = Record<string, {
    params: Params
    returns: Returns
    docs: Record<string, string[][]>
}> | null

export interface TypeValue {
    [key: string]: {
        value: string,
        doc: Record<string, string[][]>
    }
}

export interface TypeItem {
    type: 'interface' | 'type' | 'enum' | 'any' | '未知'
    value: TypeValue | string,
    docs: Record<string, string[][]>
}
/** 一个函数的收集容器对象 */
export type FileFunctionMap = {
    types: Record<string, TypeItem>,
    value: FunctionMap,
}
export interface CollectMap {
    /**
     * 文件名：{
     *     types:{},
     *     value:{}
     * }
     */
    hooks: Record<string, FileFunctionMap>,
    utils: Record<string, FileFunctionMap>,
    interfaces: any,
    globalTypes: Record<string, Record<string, TypeItem>>
}