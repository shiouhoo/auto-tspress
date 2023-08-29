#!/usr/bin/env node
import { command } from './utils/command';
import { collect } from './utils/collect';
import { createDocs } from './utils/docs';

const init = () => {
    const program = command();
    program
        .action((dirMap: { dir: string }) => {
            console.log('开始构建');
            if(!dirMap.dir) {
                console.log('文件路径为空');
                return;
            }
            const collectMap = collect(dirMap.dir);

            console.log('数据收集成功，开始生成文档');

            createDocs(collectMap).then(() => {

                console.log('文档生成成功,http://localhost:5173,请在浏览器中打开');
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
