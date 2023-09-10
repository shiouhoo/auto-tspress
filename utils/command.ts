import { Command } from 'commander';

export const command = () => {

    const program = new Command();

    program
        .name('auto-tspress')
        .description('快速生成项目中工具函数的文档')
        .version('0.0.9');

    program
        .option('-d, --dir <> [list]', '文件夹路径');

    // 如果没有提供任何参数，显示帮助信息
    if (!process.argv.slice(2).length) {
        program.help();
    }

    return program;

};