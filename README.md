# auto-tspress
这是一款hooks文档生成工具，根据ts类型以及tsdoc自动生成快速生成项目中工具函数的文档。

# why tspress

- 支持读取函数参数ts类型，不需要在函数中再次声明
- 支持文件tsdoc
- 支持读取文件路径配置使用通配符
- 自动解析类型，并支持一键跳转到类型详情
- 采用了vitepress来生成文档网站，简洁好看

# 使用

### 1.本地安装
请确保为最新版本，推荐使用pnpm安装

```node
pnpm i -D auto-tspress@latest
```

###  2. 加入运行脚本

然后在你的package.json加入以下命令

```ts
"scripts": {
	"doc": "auto-tspress"
}
```

###  3. 添加配置文件

在你的项目路径中新建一个auto-tspress.config.ts，配置项如下所示：

```js
export default () => {
    return {
        // 要解析的文件路径,内部采用ts-morph解析，详情见：https://ts-morph.com/setup/adding-source-files#by-file-globs-or-file-paths
        include: ['test/**/*.ts'],
        // 排除的文件路径
        exclude: ['**/main.ts', '**/views.ts'],
        // 是否开启debug模式，会打印文档生成过程中详细信息
        debug: false,
        // vitepress运行配置
        server: {
            // 运行端口
            port: 5073,
        }
    };
};
```

# tsdoc

tspress支持所有标准的tsdoc解析以及自定义tag解析，[@example | TSDoc](https://tsdoc.org/pages/tags/example/)，但是并不会展示所有的tsdoc，目前支持的tsdoc如下：

| tag          | 说明                                                         | 实例                        |
| ------------ | ------------------------------------------------------------ | --------------------------- |
| @param       | 参数注释                                                     | @param id 这是id            |
| @returns     | 函数返回注释                                                 | @returns 返回一个当前的时间 |
| @file        | 文件注释声明                                                 | 见下方                      |
| @description | 注释说明（该tag可以省略），可用于interface，enum，type关键字定义的类型，以及它们的内部键值对上等等 | 见下方                      |

```ts
/** 这是test接口 */
interface hh{
    /** 这是name */
    name:string
}
```

# 文件doc

这一点没有找tsdoc官方中找到，不过auto-tspress也实现了，基本和tsdoc保持一致，以下是tag说明

| tag          | 说明                                 | 实例             |
| ------------ | ------------------------------------ | ---------------- |
| @file        | 指明这是文件注释                     | @file            |
| @author      | 作者                                 | @author shiouhoo |
| @description | 文件说明，不同于tsdoc，该tag不能省略 | @description XX  |
| @date        | 文件创建日期                         | @date 2023-1-1   |

```ts
/**
 * @file
 * @description 这是hooks文件
 * @author 我
 * @date 2023-1-1
 */
```



# 常见错误

## 没有权限
 如果遇到这种错误，Error: EPERM: operation not permitted, mkdir 'D:\software\nvm\v16.13.0\node_modules\auto-tspress\docs\hooks'，请使用管理员权限运行命令行。或者参考[这里](https://www.cnblogs.com/echo-7s/p/16610255.html)设置。如果是nvm安装的node，需要在nvm的安装目录下设置，比如：nvm\v16.13.0。