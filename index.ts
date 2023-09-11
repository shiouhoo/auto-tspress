#!/usr/bin/env node
import { command } from './utils/command';
import { collect } from './utils/collect';
import { createDocs } from './utils/docs';
import { CollectMap } from './types';
import { setting } from './global';

const init = () => {
    const program = command();
    program
        .action((dirMap: { dir: string }) => {
            if(!dirMap.dir) {
                console.log('文件路径不可为空');
                return;
            }
            if(dirMap['@']) {
                setting['@'] = dirMap['@'].endsWith('/') ? dirMap['@'].slice(0, -1) : dirMap['@'];
            }
            console.log('正在解析文件，请稍后', dirMap.dir);
            const collectMap: CollectMap = collect(dirMap.dir);

            console.log('数据收集成功，开始生成文档');

            createDocs(collectMap).then(() => {

            }).catch((err) => {
                console.log(err);
            });

        });
    program.parse(process.argv);

};

try{
    init();
}catch(err) {
    // eslint-disable-next-line no-console
    console.error(err);
}
