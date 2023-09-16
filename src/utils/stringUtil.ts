/** 对象转字符串 */
export const objectToString = (obj) => {
    if (Array.isArray(obj)) {
        // 如果是数组，递归处理数组元素
        const elements = obj.map(element => objectToString(element));
        return `[${elements.join(',')}]`;
    } else if (typeof obj === 'object' && obj) {
        if (obj instanceof Date) {
            // 如果是 Date 对象，返回日期的字符串表示
            return obj.toISOString();
        } else {
        // 如果是对象，则递归处理其属性
            const keys = Object.keys(obj);
            const pairs = [];

            for (const key of keys) {
                const value = objectToString(obj[key]);
                pairs.push(`${key}:${value}`);
            }

            return `{${pairs.join(',')}}`;
        }
    } else {
        // 如果是基本数据类型或函数，则使用字符串化的值
        return JSON.stringify(obj);
    }
};
export const splitFirstChar = (str:string, char: string) => {
    const index = str.indexOf(char);
    if(index !== -1) {
        return [str.slice(0, index).trim(), str.slice(index + 1).trim()];
    }
    return [str];
};

export const escapeSpecialChars = (text:string) => {
    return text.replace(/([\\`*_{}[\]()<>#+.!-])/g, '\\$1');
};