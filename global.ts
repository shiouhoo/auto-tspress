import path from 'path';
import { fileURLToPath } from 'node:url';
import os from 'os';

export const cliPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../');

const __filenameNew = fileURLToPath(import.meta.url);

export const __dirnameNew = path.dirname(__filenameNew);

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