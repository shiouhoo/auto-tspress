import { exec } from 'child_process';

export const createDocs = () => {
    exec('pnpm docs:dev', (error, stdout, stderr) => {
        if (error) {
            console.error(`执行出错: ${error}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
    });
};