import ts from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import commonjs from '@rollup/plugin-commonjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filenameNew = fileURLToPath(import.meta.url);
const __dirnameNew = path.dirname(__filenameNew);

// tsconfig.json合并选项
// 一般来说默认使用项目的tsconfig.json，如果有个别需要修改的如下，可以在此修改
const override = { compilerOptions: { module: 'esnext' } };

export default {
    input: 'index.ts',
    output: {
        file: path.resolve(__dirnameNew, 'lib/index.js'),
        sourcemap: false,
        banner: '#!/usr/bin/env node\n',
    },
    plugins: [ // 这个插件是有执行顺序的
        ts({ tsconfig: './tsconfig.json', tsconfigOverride: override }),
        commonjs(),
        terser(),
    ]
};