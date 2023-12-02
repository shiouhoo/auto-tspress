export type TypeUnions = 'interface' | 'object' | 'record' | 'type' | 'enum' | 'union' | 'intersection' | 'number' | 'string' | 'boolean' | 'array' | 'any' | 'module';

export interface InterfaceDetail {
    [key:string]: {
        value: TypeUnions,
        isRequire: boolean,
        isIndexSignature: boolean,
        doc?: Record<string, string[][]>
    }
}

export type TypeDeclaration = {
    /** 类型名 */
    value: string,
    /** 文件路径 */
    filePath?: string,
    /** 注解 */
    docs?: Record<string, string[][]>,
    type: TypeUnions,
    /** 文档中的id名 */
    id?: string,
    /** 是否位于全局 */
    isGlobal?: boolean,
    /** 类型别名具体 */
    typeValue?: string,
    /** 类型别名详情 */
    typeDetail?: TypeDeclaration,
    /** interface | enum */
    interfaceDetail?: InterfaceDetail,
    /** array */
    arrayDetail?: TypeDeclaration,
    /** union|| intersection*/
    unionList?: TypeDeclaration[],
    /** intersection */
    intersectionList?: TypeDeclaration[]
    /** Record */
    recordDetail?: {
        key: string,
        value: TypeDeclaration
    }
}

/** 参数类型 */
export type Params = {
    /** 参数名 */
    name: string
    /** 只显示类型字面量 */
    type: string,
    isRequire: boolean,
    defaultValue?: string
}

/** 参数类型 */
export type Returns = TypeDeclaration
/** 函数收集对象 */
export type FunctionItem = {
    /** 函数名 */
    name: string,
    /** 类别 */
    classify: 'hooks' | 'utils'
    /** 注解 */
    docs?: Record<string, string[][]>,
    params?: Params[]
    returns: Returns
}

/** 一个文件的收集容器对象 */
export type FileItem = {
    /** 文件名 */
    name: string,
    /** 文件路径 */
    filePath: string,
    /** 文件头注解 */
    fileDoc?: Record<string, string>,
    /** 函数列表 */
    functionList?: FunctionItem[]
    /** 类型列表 */
    typeList?: TypeDeclaration[]
    /** 针对这个文件，复杂类型的链接 */
    link?: {
        /** 指向路径 */
        path: string,
        /** 类型名 */
        name: string
    }[],
}
export interface CollectMap {
    hooks: FileItem[],
    utils: FileItem[],
    globalTypes: FileItem[]
}
