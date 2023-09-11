# auto-tspress
这是一款hooks文档生成工具，根据ts类型以及tsdoc自动生成快速生成项目中工具函数的文档。

# why tspress

- 支持读取函数参数ts类型，不需要在函数中再次声明
- 支持文件doc
- 支持文件参数使用通配符
- 采用了vitepress来生成文档网站，简洁好看

# 使用

### 1.全局安装(推荐)
如果使用淘宝源安装，可能不是最新的包，请确保为最新版本，可以使用npm官方源安装

```node
npm i -g auto-tspress@latest
```

进入一个项目目录，运行命令：

```node
auto-tspress -d "utils.ts"
```

### 2.  npx或pnpx

进入一个项目目录，运行命令即可（npx不会在本地安装，所以每次都会下载最新的包，可能会等待一会，受不了的朋友可以全局安装）
```npm
npx auto-tspress -d "utils.ts"
```
随后，会在 http://localhost:5073中启动一个静态服务器。

# 命令参数

在使用过程中，auto-tspress提供了多个命令支持运行。

| 参数      | 说明                                                         | 必传 |
| --------- | ------------------------------------------------------------ | ---- |
| -d或--dir | 要解析的文件，支持通配符解析，如果有多个文件需要加上引号，如“utils/\*{.d.ts,.ts} index.ts”,如果你想排除某个文件，可以使用!,如“src/\*\*/\*.ts  !main.ts” | 是   |
| -@ | 如果你的项目使用了路径别名请配置该参数，默认值为`src` | 否   |

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