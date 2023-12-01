import { cliPath, config } from './global';
import { spawn } from 'child_process';
import { CollectMap, FileItem, } from './types';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { MdCreator } from './mdCreate';
import { log } from './log';

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
// 写入文件内容
const changeFile = (filePath: string, data: string) => {
    try{
        fs.writeFileSync(filePath, data, 'utf8');
    }catch(e) {
        throw new Error('写入文件失败，请确保你有权限' + e);
    }
};

/** 删除docs文件夹中原有的md文件 */
const deleteFolderDocs = ()=> {
    try{
        for(const item of ['hooks', 'utils', 'globalTypes']) {
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
        throw new ReferenceError('删除目录失败，请确保你有权限' + e);
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
        throw new Error('修改首页文档失败，请确保你有权限' + err);
    }

};

/** 生成文档侧边栏 */
const createSidebar = (collectMap: CollectMap) => {
    let startPath = '';
    for(const item of ['hooks', 'utils', 'globalTypes']) {
        log.logDebug(`正在生成${item}的文档`);
        if(!fs.existsSync(path.join(cliPath, `/docs/${item}`))) {
            fs.mkdirSync(path.join(cliPath, `/docs/${item}`));
        }
        // 文件路径
        const filePath = path.join(cliPath, `/docs/${item}.js`);
        const data = {
            item: [],
            // 点击右上方按钮跳转
            link: `/${item}/${collectMap[item]?.[0]?.filePath?.split('/')?.slice(-2).join('-') || ''}`
        };
        for(const fileItem of collectMap[item]) {
            log.logDebug(`正在生成${fileItem.name}的md文档`);
            const fileName = fileItem.filePath.split('/').slice(-2).join('-');
            data.item.push({
                text: fileName.replace('-', '/'),
                link: `/${item}/${fileName}`
            });
            if(!startPath) {
                startPath = `/${item}/${fileName}`;
            }
            // 生成对应的md文件
            createContent(path.join(cliPath, `/docs/${item}/${fileName}.md`), fileItem, fileName, <'utils'|'hooks'|'globalTypes'>item);
        }
        // 这一项没有任何文档
        if(!collectMap[item] || !collectMap[item].length) {
            copy(path.join(cliPath, `/docs/.vitepress/index.md`), path.join(cliPath, `/docs/${item}/index.md`));
        }
        // 改变目录
        const fileData = 'export default' + JSON.stringify(data, null, 4);
        changeFile(filePath, fileData);
    }
    // 修改首页md文档
    changeFirstPage(startPath);

};

/** 生成一个文件的md文档 */
const createContent = (filePath:string, fileItem: FileItem, fileName:string, itemType:'utils'|'hooks'|'globalTypes') => {
    const mdCreator = new MdCreator();
    mdCreator.createTitle(1, fileName.replace('-', '/'));
    mdCreator.createFileDoc(fileItem.fileDoc);
    mdCreator.createLinkNext();
    if(itemType === 'utils' || itemType === 'hooks') {
        // 函数
        mdCreator.createTitle(2, itemType === 'hooks' ? 'hooks' : '函数', false);
        // mdCreator.createText(`以下为文件中的${itemType === 'hooks' ? 'hooks' : '工具函数'}`);
        const globalTypeMap = {};
        for(const t of fileItem.typeList.filter(item => item.isGlobal)) {
            globalTypeMap[t.value] = t.filePath.split('/')?.slice(-2).join('-') + '.html';
        }
        if(Object.keys(globalTypeMap).length) {
            for(const linkItem of fileItem.link) {
                if(globalTypeMap[linkItem.name]) {
                    linkItem.path = '/globalTypes/' + globalTypeMap[linkItem.name] + linkItem.path;
                }
            }
        }

        for(const func of fileItem.functionList) {
            const funcName = func.name;
            mdCreator.createTitle(3, funcName);
            mdCreator.createText(func.docs?.['@description']?.[0]?.[0] || func.docs?.comment?.[0]?.[0], '描述');
            mdCreator.createParamsTable(func.params, fileItem.link, func.docs);
            mdCreator.createTitle(4, '返回值', false);
            mdCreator.createReturns(func.returns, fileItem.link);
            func.docs?.['@returns']?.[0]?.[0] && mdCreator.createText(func.docs?.['@returns']?.[0]?.[0] || '暂无', '返回值说明');
        }
    }
    // type
    const funcTypeShow = ['utils', 'hooks'].includes(itemType) && fileItem.typeList.filter(item=> !item.isGlobal).length;
    funcTypeShow && mdCreator.createTitle(2, '类型', false);
    // 是否显示全局类型表格
    const globalTypeTableShow = itemType === 'globalTypes' && fileItem.typeList.length;
    if(funcTypeShow || globalTypeTableShow) {
        const typeList = fileItem.typeList;
        for(const type of typeList) {
            // 全局类型在局部不显示
            if(['utils', 'hooks'].includes(itemType) && type.isGlobal) continue;

            const typeName = type.value;
            mdCreator.createTitle(3, typeName + `<Badge type="tip" text=${type.type} />`);
            // TODO 暂时不考虑多个tag存在的情况
            mdCreator.createText(type.docs?.['@description']?.[0]?.[0] || type.docs?.comment?.[0]?.[0], '描述');
            // type.generics && mdCreator.createDescText(type.generics, { tag: '泛型' });
            if(type.type === 'module') {
                mdCreator.createDescText(type.filePath.split('node_modules/').slice(1).join(''), { tag: '模块' });
            }
            if(type.type === 'type') {
                if(!type.typeDetail) {
                    mdCreator.createTsCode(type.typeValue);
                }else{
                    mdCreator.createTypesTable(type.typeDetail, fileItem.link);
                }
            }else{
                mdCreator.createTypesTable(type, fileItem.link);
            }

        }

    }
    changeFile(filePath, mdCreator.getContent());
};
export const createDocs = (collectMap: CollectMap) => {
    deleteFolderDocs();
    createSidebar(collectMap);
    return new Promise((resolve, reject) => {
        let child;

        if (os.platform() === 'win32') {
            // Windows
            child = spawn('cmd.exe', ['/c', `cd /d ${cliPath} && npm run docs:dev --port ${config.server.port}`]);
        } else {
            // macOS 或 Linux
            child = spawn('sh', ['-c', `cd "${cliPath.replaceAll('\\', '/')}" && npm run docs:dev --port ${config.server.port}`]);
        }

        child.stdout.on('data', (data) => {
            // eslint-disable-next-line no-console
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