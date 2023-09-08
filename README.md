# tspress
这是一款hooks文档生成工具，根据ts类型以及tsdoc自动生成快速生成项目中工具函数的文档。

# why tspress

tspress内部采用了ts-morph库中的AST API来收集所需信息，可以识别函数参数中的ts类型，不用重复在tsdoc中声明。其次，采用了vitepress来生成文档网站，符合主流审美，观看更加的清楚。

# 使用
进入一个项目目录，运行命令即可
```npm
npx tspress -d "utils.ts"
```
随后，会在 http://localhost:5073中启动一个静态服务器。

# 命令参数

在使用过程中，tspress提供了多个命令支持运行。

| 参数      | 说明                                                         | 必传 |
| --------- | ------------------------------------------------------------ | ---- |
| -d或--dir | 要解析的文件，支持通配符解析，如果有多个文件需要加上引号，如“utils/*.ts  index.ts” | 是   |
|           |                                                              |      |
|           |                                                              |      |

# tsdoc

tspress支持所有标准的tsdoc解析以及自定义tag解析，[@example | TSDoc](https://tsdoc.org/pages/tags/example/)，但是并不会展示所有的tsdoc，目前支持的tsdoc如下：

| tag          | 说明                                                         | 实例                        |
| ------------ | ------------------------------------------------------------ | --------------------------- |
| @param       | 参数注释                                                     | @param id 这是id            |
| @returns     | 函数返回注释                                                 | @returns 返回一个当前的时间 |
| @description | 注释说明（该tag可以省略），可用于interface，enum，type关键字定义的类型，以及它们的内部键值对上 | 见下方                      |

```ts
/** 这是test接口 */
interface hh{
    /** 这是name */
    name:string
}
```

