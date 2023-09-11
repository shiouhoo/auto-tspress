# auto-tspress
这是一款hooks文档生成工具，根据ts类型以及tsdoc自动生成快速生成项目中工具函数的文档。

# why tspress

tspress内部采用了ts-morph库中的AST API来收集所需信息，可以识别函数参数中的ts类型，不用重复在tsdoc中声明。其次，采用了vitepress来生成文档网站，符合主流审美，观看更加的清楚。

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

在使用过程中，tspress提供了多个命令支持运行。

| 参数      | 说明                                                         | 必传 |
| --------- | ------------------------------------------------------------ | ---- |
| -d或--dir | 要解析的文件，支持通配符解析，如果有多个文件需要加上引号，如“utils/*.ts  index.ts” | 是   |

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

# 常见错误

## 没有权限
 如果遇到这种错误，Error: EPERM: operation not permitted, mkdir 'D:\software\nvm\v16.13.0\node_modules\auto-tspress\docs\hooks'，请使用管理员权限运行命令行。或者参考[这里](https://www.cnblogs.com/echo-7s/p/16610255.html)设置。如果是nvm安装的node，需要在nvm的安装目录下设置，比如：nvm\v16.13.0。