import { cliPath } from './../global';
import { spawn } from 'child_process';
import { FunctionMap } from '../types';
import fs from 'fs';
import os from 'os';

const changeFile = (filePath: string, data: string) => {
    fs.writeFileSync(filePath, data, 'utf8');
};

const createSidebar = (collectMap: Record<string, FunctionMap>) => {
    const filePath = `${cliPath}/docs/hooks.js`;
    const data = {
        item: []
    };
    // key 为文件名
    for(const key in collectMap) {
        const fileName = key.split('.')[0];
        data.item.push({
            text: key,
            link: `/hooks/${fileName}`
        });
        createContent(`${cliPath}/docs/hooks/${fileName}.md`, collectMap[key]);
    }
    const fileData = `export default ${JSON.stringify(data)}`;
    changeFile(filePath, fileData);
};

const createContent = (filePath:string, content: FunctionMap) => {
    changeFile(filePath, JSON.stringify(content));
};

const createMarkdown = (collectMap: Record<string, FunctionMap>) => {
    createSidebar(collectMap);
};

export const createDocs = (collectMap: Record<string, FunctionMap>) => {
    createMarkdown(collectMap);
    return new Promise((resolve, reject) => {
        let child;

        if (os.platform() === 'win32') {
            // Windows
            child = spawn('cmd.exe', ['/c', `cd /d ${cliPath} && npx vitepress dev docs --port 5073`]);
        } else {
            // macOS 或 Linux
            child = spawn('sh', ['-c', `cd "${cliPath.replaceAll('\\', '/')}" && npx vitepress dev docs --port 5073`]);
        }

        child.stdout.on('data', (data) => {
            console.log(`${data}`);
            if(`${data}`.includes('http://localhost')) {
                resolve('执行成功');
            }
        });

        child.stderr.on('data', (data) => {
            reject(`${data}`);
        });
    });
};