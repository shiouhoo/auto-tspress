import path from 'path';
import { fileURLToPath } from 'url';

// 脚手架路径
export const cliPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../');
// 项目路径
export const projectPath = process.cwd();

const __filenameNew = fileURLToPath(import.meta.url);

export const __dirnameNew = path.dirname(__filenameNew);

export const setting = {
    'dir': '',
    '@': 'src',
    'isPrintCollect': false,
    'port': 5073
};

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