import { JSDoc, SourceFile } from 'ts-morph';
import { lineSysbol } from '../../global';
import { splitFirstChar } from '../stringUtil';

// 收集jsDoc
export function collectDoc(doc: JSDoc) {
    if (!doc) return null;
    const docMap: Record<string, string[][]> = {
        comment: [[doc.getComment() as string || '']]
    };
    for (const jsDocTag of doc.getTags()) {
        const [tagName, rest] = splitFirstChar(jsDocTag.getText().replaceAll('*', ''), ' ', true);
        if (docMap[tagName]) {
            docMap[tagName].push(splitFirstChar(rest, ' ', true) as string[]);
        } else {
            docMap[tagName] = [splitFirstChar(rest, ' ', true) as string[]];
        }
    }
    return Object.keys(docMap).length ? docMap : null;
}

// 收集文件注释
export const collectFileDoc = (sourceFile: SourceFile) => {
    const fileText = sourceFile.getFullText().trim();
    const match = fileText.match(/^\/\*\*\s*\n([\s\S]*?)\s*\*\//);
    const fileDocMap: Record<string, string> = {};
    if(match && match[1].includes('@file')) {
        for(const line of match[1].split(lineSysbol)) {
            if(line.includes('@file')) continue;
            const [tagName, ...rest] = line.replace(/^[ *]+?@/, '@').split(' ');
            fileDocMap[tagName] = rest.join();
        }
    }
    return Object.keys(fileDocMap).length ? fileDocMap : null;
};