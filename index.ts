#!/usr/bin/env node
import { command } from './utils/command';
import { collect } from './utils/collect';
import { createDocs } from './utils/docs';
import { CollectMap } from './types';

const init = () => {
    const program = command();
    program
        .action((dirMap: { dir: string }) => {
            if(!dirMap.dir) {
                console.log('文件路径为空');
                return;
            }
            console.log('开始构建');
            const collectMap: CollectMap = collect(dirMap.dir);

            console.log('数据收集成功，开始生成文档', collectMap);

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
