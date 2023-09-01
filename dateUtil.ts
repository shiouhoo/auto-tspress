/**
 * 日期工具函数
 */
import dayjs from 'dayjs';

/**
 * 日期操作类型
 */
interface IDateAction {
    /**
     * 操作类型，add为加，reduce为减
     */
    type: 'add' | 'reduce';
    /**
     * 操作值
     */
    value: number;
    /**
     * 操作单位，默认为day
     */
    mold?: 'day' | 'month' | 'year';
}

/**
 *  @description 获取当前时间
 *  @param fmt 时间格式，默认为'YYYY-MM-DD HH:mm:ss'
 *  @param action 日期操作对象
 *  @returns 当前时间或者操作后的时间
 */
export const getDateNow = (fmt = 'YYYY-MM-DD HH:mm:ss', action?: Record<string, string>) => {
    const d = dayjs().format(fmt);
    if (!action) return d;
    const { type, value, mold = 'day' } = action;
    if (type === 'add') return dayjs(d).add(value, mold).format(fmt);
    if (type === 'reduce') return dayjs(d).subtract(value, mold).format(fmt);
    return d;
};

/**
 * 去除日期字符串中月，日,小时的0,如：2021-01-01 => 2021-1-1
 * @param date 日期字符串
 * @param isLabel 是否需要加上年月日标签
 * @returns 去除0后的日期字符串
 */
export const removeStringDateZero = (date: string, isLabel = false) => {
    const d: number[] | string[] = date.split(/[ :-]/);
    d[3] = d[3] ? ` ${Number(d[3])}` : '';
    d[4] = d[4] ? `:${d[4]}` : '';
    d[5] = d[5] ? `:${d[5]}` : '';
    if (isLabel) {
        return `${d[0]}年${Number(d[1])}月${Number(d[2])}日${d[3]}${d[4]}${d[5]}`;
    }
    return `${d[0]}-${Number(d[1])}-${Number(d[2])}${d[3]}${d[4]}${d[5]}`;
};

/**
 * 获取今天的日期范围
 */
export const getRangeNowDay = () => {
    return `${dayjs().format('YYYY-MM-DD 00:00:00')},${dayjs().format('YYYY-MM-DD 23:59:59')}`;
};
