/** 解析文件名 */
export const parseFileName = (fileName:string) => {
    if(fileName === 'index.ts') {
        fileName = 'Index.ts';
    }
    return fileName;
};
