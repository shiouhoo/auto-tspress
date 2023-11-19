// // import { TypeValue } from '@/types';
// import { collectDoc } from '../collect/collectDoc';
// import { InterfaceDeclaration, EnumDeclaration } from 'ts-morph';
// import { splitFirstChar } from '../stringUtil';

// /** 通过字符串获取类型 */
// export const getTypeByText = (str: string, splitIndex = 1): string => {
//     if(/^['"`].+['"`]$/.test(str)) {
//         return 'string';
//     }else if(!Number.isNaN(Number(str))) {
//         return 'number';
//     }else if(str === 'true' || str === 'false') {
//         return 'boolean';
//     }else if(str.includes('new')) {
//         const match = str.match(/new (.+?)\(/);
//         return match ? match[1] : '';
//     }else if(str.includes('.')) {
//         if(Number.isNaN(Number(str.split('.')[splitIndex]))) {
//             return str.split('.')[splitIndex];
//         }
//     }
//     return str;
// };

// // 判断字符串是否为基本类型
// export const isBaseType = (str: string) => {
//     return /^\w*(string|number|boolean|undefined|null|symbol)\w*$/.test(str);
// };

// /** 将type的信息转为对象 */
// export const getDetailTypeByString = (str:string): [ string, 'array'|'object'|'string']=>{
//     let targetType;
//     const typeObject = {};
//     if((str = str.trim()).startsWith('Record')) {
//         targetType = 'Record';
//         const match = str.match(/^Record<\s*([^,]+)\s*,\s*([\s\S]+)>/)?.map(str => str.trim());
//         if(match) {
//             typeObject[match[1]] = {
//                 value: match[2],
//                 isRequire: null,
//                 doc: null
//             };
//         }
//         return [typeObject, targetType];
//     }else if(str.match(/\{([\s\S]+)\}\[\]$/)) {
//         targetType = 'array';
//     }else if(str.match(/\{([\s\S]+)\}$/)) {
//         targetType = 'object';
//     }else{
//         return [str, 'string'];
//     }
//     // 配置doc和第二行的键值对
//     let bracketLevel = 0;
//     str = str.match(/\{([\s\S]*)\}/)[1].replaceAll('\r\n', '\n').trim();
//     for(let i = 0;i < str.length;i++) {
//         let [comment, keyValue] = ['', ''];
//         let char = str[i];
//         if(char === ' ') continue;
//         // 匹配注释
//         if(char === '/' && str[i + 1] === '*' && str[i + 2] === '*') {
//             const idx = str.indexOf('*/', i);
//             comment = str.slice(i + 3, idx).trim();
//             i = idx + 3;
//         }else if(char === '/' && str[i + 1] === '/') {
//             const idx = str.indexOf('\n', i);
//             comment = str.slice(i + 2, idx).trim();
//             i = idx + 2;
//         }
//         // 匹配键值
//         do{
//             char = str[i];
//             keyValue += char;
//             if (char === '<' || char === '{') {
//                 bracketLevel++;
//             } else if (char === '>' || char === '}') {
//                 bracketLevel--;
//             }
//             i++;
//         }while(i < str.length && (char !== '\n' || bracketLevel !== 0));
//         const [key, value] = splitFirstChar(keyValue, ':').map(str => str.replace(/[,;]\s*$/, '').trim());
//         const isRequire = !key.includes('?');
//         typeObject[isRequire ? key : key.replace('?', '')] = {
//             value: value,
//             isRequire,
//             doc: comment && {
//                 comment: [[comment.replace(/^\s*\**(.*?)\**\s*$/g, '$1').trim() || '']]
//             }
//         };
//     }

//     return [typeObject, targetType];

// };