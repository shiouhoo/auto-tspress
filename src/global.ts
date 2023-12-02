import path from 'path';
import { fileURLToPath } from 'url';
import { Project, SourceFile, TypeChecker } from 'ts-morph';

// 脚手架路径
export const cliPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../');
// 项目路径
export const projectPath = process.cwd();

const __filenameNew = fileURLToPath(import.meta.url);

export const __dirnameNew = path.dirname(__filenameNew);

// 根据系统返回对应文件系统的换行符
export function setReturnSymbol(content: string) {
    if (content.includes('\r\n')) {
        lineSysbol = '\r\n';
    } else if (content.includes('\n')) {
        lineSysbol = '\n';
    }
}

export let lineSysbol = '\n';
/** 判断路径是否相等，file1：完整路径，file2：相对路径 */
export const isSameFilePath = (file1: string, file2: string) => {
    if(!file2.includes('@')) {
        // 判断是否指向同一个文件
        return path.join(file1).toString() === path.join(projectPath, file2).toString();
    }
};

interface ConfigObj {
    include: ['src/**/*.ts'],
    exclude: [],
    debug: false,
    server: {
        port: 5073,
    }
}
class Config {
    include: string[] = [];
    exclude: string[] = [];
    debug = false;
    server = {
        port: 5073,
    };
    // 读取运行目录的config文件
    constructor() {
        this.include = [];
        this.exclude = [];
        this.debug = false;
        this.server = {
            port: 5073,
        };
    }

    setConfig(config: ConfigObj) {
        this.include = config?.include || [];
        this.exclude = config?.exclude?.map((item) => '!' + item) || [];
        this.debug = config?.debug || false;
        this.server = {
            ...this.server,
            ...(config?.server || {})
        };
    }
}

export const config = new Config();

// ts-morph实例
export const tsMorph : {
    project: Project,
    sourchFile: SourceFile,
    typeChecker: TypeChecker,
} = {
    project: {} as any,
    typeChecker: {} as any,
    sourchFile: {} as any,
};