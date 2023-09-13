/** 参数类型 */
export type Params = {
    /** name */
    // TODO 对象解析
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
}>

/** TypeItem中的value项 */
export interface TypeValue {
    /**
     * 属性名：{
     *    value: 属性值,
     *    doc: 注释
     * }
     */
    [key: string]: {
        value: string,
        doc: Record<string, string[][]>
    }
}

export interface TypeItem {
    type: 'interface' | 'type' | 'enum' | 'any' | '未知'
    value: TypeValue | string,
    docs: Record<string, string[][]>
    /** 针对type */
    targetType?: 'object' | 'array' | 'string' | 'Record'
    moduleName?: string
}
/** 一个文件的收集容器对象 */
export type FileMap = {
    types: Record<string, TypeItem>,
    value: FunctionMap,
    fileDoc: Record<string, string>
}
export interface CollectMap {
    /**
     * 文件名：{
     *     types:{},
     *     value:{}
     * }
     */
    hooks: Record<string, FileMap>,
    utils: Record<string, FileMap>,
    globalTypes: Record<string, Record<string, TypeItem>>
}
/** 用于收集函数中用到的类型 */
export interface UseTypes{
    util: Set<string>,
    hooks: Set<string>,
}