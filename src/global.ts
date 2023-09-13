import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
// 脚手架路径
export const cliPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../');
// 项目路径
export const projectPath = process.cwd();

const __filenameNew = fileURLToPath(import.meta.url);

export const __dirnameNew = path.dirname(__filenameNew);

export const setting = {
    'dir': '',
    '@': 'src'
};

// 根据系统返回对应文件系统的换行符
function getReturnSymbol() {
    switch (os.platform()) {
    case 'linux':
    case 'darwin': return '\n'; // macOS
    case 'win32': return '\r\n'; // windows
    case 'aix':
    case 'freebsd':
    case 'openbsd':
    case 'sunos':
    default: return '\n';
    }
}

export const lineSysbol = getReturnSymbol();
/** 判断路径是否相等，file1：完整路径，file2：相对路径 */
export const isSameFilePath = (file1: string, file2: string) => {
    if(!file2.includes('@')) {
        // 判断是否指向同一个文件
        return path.join(file1).toString() === path.join(projectPath, file2).toString();
    }
};