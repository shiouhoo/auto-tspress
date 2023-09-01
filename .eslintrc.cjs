module.exports = {
    env: {
        node: true,
        es2021: true
    },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        '@shiouhoo'
    ],
    overrides: [
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    plugins: [
        '@typescript-eslint'
    ],
    ignorePatterns: ['lib', 'docs/*.js'],
    rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
    }
};