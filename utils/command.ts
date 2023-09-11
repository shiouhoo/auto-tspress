import { Command } from 'commander';
import { version } from '../package.json';

export const command = () => {

    const program = new Command();

    program
        .name('auto-tspress')
        .description('快速生成项目中工具函数的文档')
        .version(version);

    program
        .option('-d, --dir <> [list]', '文件夹路径')
        .option('-@ <> [list]', '路径别名');

    // 如果没有提供任何参数，显示帮助信息
    if (!process.argv.slice(2).length) {
        program.help();
    }

    return program;

};