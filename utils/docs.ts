import { cliPath } from './../global';
import { exec } from 'child_process';
import { FunctionMap } from '../types';
import fs from 'fs';

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
        exec(`cd ${cliPath} && npx vitepress dev docs`, (error) => {
            if (error) {
                reject(`执行出错: ${error}`);
                return;
            }
            resolve('执行成功');
        });

    });
};