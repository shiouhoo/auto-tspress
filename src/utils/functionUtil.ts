import { VariableStatement } from 'ts-morph';
import { lineSysbol } from '@/global';

// 判断是否是函数
export const varibleIsFunction = (variable: VariableStatement | string) => {
    const test = typeof variable === 'string' ? variable : variable.getText().split(lineSysbol)[0];
    return test.indexOf('=>') > -1 || test.indexOf('function') > -1;
};

