import { VariableStatement } from 'ts-morph';

// 判断是否是函数
export const varibleIsFunction = (variable: VariableStatement | string) => {
    const test = typeof variable === 'string' ? variable : variable.getText().split('\n')[0];
    return test.indexOf('=>') > -1 || test.indexOf('function') > -1;
};

