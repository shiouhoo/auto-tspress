#!/usr/bin/env node
import { command } from './utils/command';
import { collect } from './utils/collect';

const init = () => {
    const program = command();
    program
        .action((dirMap: { dir: string }) => {
            if(!dirMap.dir) {
                console.log('文件路径为空');
                return;
            }
            const collectMap = collect(dirMap.dir);

            console.log(JSON.stringify(collectMap));
        });
    program.parse(process.argv);

};

try{
    init();
}catch(err) {
    // eslint-disable-next-line no-console
    console.error(err);
}

