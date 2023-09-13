import { command } from './src/command';
import { collect } from './src/utils/collect';
import { createDocs } from './src/docs';
import { CollectMap } from './src/types';
import { setting } from './src/global';
import fs from 'fs';
import path from 'path';

const init = () => {
    try{
        const pkg = fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8');
        const config = JSON.parse(pkg)['auto-tspress'];
        for(const key in config) {
            if(!(key in setting)) {
                console.warn(`配置项${key}不存在`);
            }else{
                setting[key] = config[key];
            }
        }
    } catch (e) {
        if(e.code === 'ENOENT') {
            console.log('找不到package.json文件，将使用命令行参数');
        }
    }
    const program = command();
    program
        .action((dirMap: { dir: string }) => {
            if(dirMap.dir) {
                setting.dir = dirMap.dir;
            }
            if(dirMap['@']) {
                setting['@'] = dirMap['@'].endsWith('/') ? dirMap['@'].slice(0, -1) : dirMap['@'];
            }
            if(!setting.dir) {
                console.log('解析文件不可为空');
                return;
            }
            console.log('正在解析文件，请稍后', setting.dir);
            const collectMap: CollectMap = collect(setting.dir);

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
