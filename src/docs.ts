import { cliPath, setting } from './global';
import { spawn } from 'child_process';
import { CollectMap, FileMap, TypeItem } from './types';
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
        log.logCollect(`正在生成${item}的文档`);
        if(!fs.existsSync(path.join(cliPath, `/docs/${item}`))) {
            fs.mkdirSync(path.join(cliPath, `/docs/${item}`));
        }
        const filePath = path.join(cliPath, `/docs/${item}.js`);
        const data = {
            item: [],
            link: `/${item}/${Object.keys(collectMap[item] || {})[0]?.split('.')?.[0] || ''}`
        };
            // key 为完整文件名
        for(const key in collectMap[item] || {}) {
            log.logCollect(`-----------------------`);
            log.logCollect(`正在生成${key}的md文档`);
            const fileName = key.split('.')[0];
            data.item.push({
                text: key,
                link: `/${item}/${fileName}`
            });
            if(!startPath) {
                startPath = `/${item}/${fileName}`;
            }
            // 生成对应的md文件
            createContent(path.join(cliPath, `/docs/${item}/${fileName}.md`), collectMap[item][key], key, <'utils'|'hooks'|'globalTypes'>item, collectMap.globalTypes[key]);
        }
        // 这一项没有任何文档
        if(!collectMap[item] || !Object.keys(collectMap[item]).length) {
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
const createContent = (filePath:string, funcs: FileMap, fileName:string, itemType:'utils'|'hooks'|'globalTypes', globalTypeMap: Record<string, TypeItem>) => {
    const mdCreator = new MdCreator(funcs.useTypesFileMap);
    mdCreator.createTitle(1, fileName);
    mdCreator.createFileDoc(funcs.fileDoc);
    mdCreator.createLinkNext();
    if(itemType === 'utils' || itemType === 'hooks') {
        // 函数
        mdCreator.createTitle(2, itemType === 'hooks' ? 'hooks' : '函数', false);
        // mdCreator.createText(`以下为文件中的${itemType === 'hooks' ? 'hooks' : '工具函数'}`);
        for(const funcName in funcs.value) {
            const func = funcs.value[funcName];
            mdCreator.createTitle(3, funcName);
            mdCreator.createText(func.docs?.['@description']?.[0]?.[0] || func.docs?.comment?.[0]?.[0]);
            mdCreator.createParamsTable(func.params, func.docs);
            mdCreator.createTitle(4, '返回值', false);
            mdCreator.createReturns(func.returns?.type || 'void', 'type');
            func.docs?.['@returns']?.[0]?.[0] && mdCreator.createReturns(func.docs?.['@returns']?.[0]?.[0] || '暂无', 'describe');
        }
    }
    // type
    const funcTypeShow = ['utils', 'hooks'].includes(itemType) && funcs.types;
    funcTypeShow && mdCreator.createTitle(2, '类型', false);
    const globalTypeTableShow = itemType === 'globalTypes' && globalTypeMap;
    if(funcTypeShow || globalTypeTableShow) {
        const map = funcTypeShow ? funcs.types : globalTypeMap;
        for(const typeName in map) {
            const type = map[typeName];
            if(!type) {
                mdCreator.createTitle(3, typeName);
                mdCreator.createText('未知类型，可能是第三方包提供');
                continue;
            }
            mdCreator.createTitle(3, typeName + ` <Badge type="tip" text=${type.type} />`);
            mdCreator.createText(type.docs?.['comment']?.[0]?.[0]);
            type.generics && mdCreator.createDescText(type.generics, { tag: '泛型' });
            if(type.targetType === 'Record') {
                const key = Object.keys(type.value)[0];
                mdCreator.createDescText('Record', { tag: '类型' });
                mdCreator.createTsCode(`Record<${key},${(<string>type.value[key].value)}>`);
            }else if(type.type === '未知') {
                if(type.moduleName) {
                    mdCreator.createText(type.moduleName, '包名');
                }
            }else{
                mdCreator.createTypesTable(type);
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
            child = spawn('cmd.exe', ['/c', `cd /d ${cliPath} && vitepress dev docs --port ${setting.port}`]);
        } else {
            // macOS 或 Linux
            child = spawn('sh', ['-c', `cd "${cliPath.replaceAll('\\', '/')}" && vitepress dev docs --port ${setting.port}`]);
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