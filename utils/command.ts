import { Command } from 'commander';

export const command = () => {

    const program = new Command();

    program
        .name('quick-tsdoc')
        .description('快速生成项目中工具函数的文档')
        .version('1.0.0');

    program
        .option('-d, --dir [list]', '文件夹路径');

    return program;

};