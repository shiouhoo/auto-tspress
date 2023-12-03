import { collect } from './src/utils/collect';
import { createDocs } from './src/docs';
import { CollectMap } from './src/types';
import { config } from './src/global';
import { ConfigError } from './src/error';
import { log } from './src/log';
import fs from 'fs';
import path from 'path';
import { Project, Node } from 'ts-morph';

const init = async () => {

    // 读取运行目录的config文件
    const configPath = path.join(process.cwd(), 'auto-tspress.config.ts');
    // 文件存在则读取
    if(fs.existsSync(configPath)) {
        const project = new Project();
        const sourceFile = project.addSourceFileAtPath(configPath);
        const defaultExportSymbol = sourceFile.getDefaultExportSymbol();
        if(!defaultExportSymbol) {
            throw new ConfigError('config文件必须导出一个默认的函数');
        }
        const declaration = defaultExportSymbol.getDeclarations()[0];

        if (declaration && Node.isExportAssignment(declaration)) {
            const expression = declaration.getExpression();
            const func = eval(expression.getText());
            config.setConfig(func());
        }
    }
    if(!config.include.length) {
        throw new ConfigError('include配置不可为空');
    }

    log.log('auto-tspress,开始运行');
    const collectMap: CollectMap = collect();

    log.log('数据收集成功，开始生成文档');

    createDocs(collectMap).then(() => {

    }).catch((err) => {
        log.log(err);
    });

};

(async () => {
    try {
        await init();
    } catch (err) {
        if(err instanceof ConfigError) {
            log.log(err.message);
            return;
        }
        log.console(err);
    }
})();