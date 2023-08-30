import { cliPath } from './../global';
import { spawn } from 'child_process';
import { FunctionMap, CollectMap } from '../types';
import fs from 'fs';
import os from 'os';
import path from 'path';

// 移动文件
function copy(src, dest) {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
        copyDir(src, dest);
    } else {
        fs.copyFileSync(src, dest);
    }
}
// 移动文件夹
function copyDir(srcDir:string, destDir:string) {
    fs.mkdirSync(destDir, { recursive: true });
    for (const file of fs.readdirSync(srcDir)) {
        const srcFile = path.resolve(srcDir, file);
        const destFile = path.resolve(destDir, file);
        copy(srcFile, destFile);
    }
}

const changeFile = (filePath: string, data: string) => {
    fs.writeFileSync(filePath, data, 'utf8');
};

/** 删除docs文件夹中原有的md文件 */
const deleteFolderDocs = ()=> {
    try{
        for(const item of ['hooks', 'utils', 'interfaces']) {
            const folderPath = path.join(cliPath, `docs/${item}`);
            if (fs.existsSync(folderPath)) {
                fs.readdirSync(folderPath).forEach(function (file) {
                    const curPath = path.join(folderPath, file);
                    if (fs.existsSync(curPath) && fs.statSync(curPath).isFile()) {
                        fs.unlinkSync(curPath);
                    }
                });
            }
        }
    }catch(e) {
        new ReferenceError('删除目录失败，请确保你有权限' + e);
    }
};

/** 改变首页md文档 */
const changeFirstPage = (startPath: string)=>{
    try{
        copy(path.join(cliPath, `/docs/.vitepress/first.md`), path.join(cliPath, `/docs/index.md`));
        // 读取Markdown文件
        const data = fs.readFileSync(path.join(cliPath, '/docs/index.md'), 'utf8');
        // 在这里对Markdown内容进行修改
        const modifiedContent = data.replace('{startpath}', startPath || '/hooks/');
        fs.writeFileSync(path.join(cliPath, '/docs/index.md'), modifiedContent, 'utf8');

    }catch(err) {
        new Error('修改首页文档失败:', err);
    }

};

/** 生成文档侧边栏 */
const createSidebar = (collectMap: CollectMap) => {
    try{
        let startPath = '';
        for(const item of ['hooks', 'utils', 'interfaces']) {
            const filePath = path.join(cliPath, `/docs/${item}.js`);
            const data = {
                item: [],
                link: `/${item}/`
            };
            // key 为文件名
            for(const key in collectMap[item]) {
                const fileName = key.split('.')[0];
                data.item.push({
                    text: key,
                    link: `/${item}/${fileName}`
                });
                if(!startPath) {
                    startPath = `/${item}/${fileName}`;
                    data.link = `/${item}/${fileName}`;
                }
                // 生成对应的md文件
                createContent(path.join(cliPath, `/docs/${item}/${fileName}.md`), collectMap[item][key]);
            }
            const fileData = `export default ${JSON.stringify(data)}`;
            changeFile(filePath, fileData);
            // 这一项没有任何文档
            if(!Object.keys(collectMap[item]).length) {
                copy(path.join(cliPath, `/docs/.vitepress/index.md`), path.join(cliPath, `/docs/${item}/index.md`));
            }
        }
        // 修改首页md文档
        changeFirstPage(startPath);
    }catch(e) {
        new ReferenceError('删除目录失败，请确保你有权限' + e);
    }

};

/** 生成md文档 */
const createContent = (filePath:string, content: FunctionMap) => {
    changeFile(filePath, JSON.stringify(content));
};

const createMarkdown = (collectMap: CollectMap) => {
    deleteFolderDocs();
    createSidebar(collectMap);
};

export const createDocs = (collectMap: CollectMap) => {
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