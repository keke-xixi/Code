module.exports = {
    root: true,
    env: {
        browser: true,
        es2021: true,
        node: true,
    },
    plugins: ['vue', '@typescript-eslint'],
    extends: [
        'eslint:recommended',
        '@vue/eslint-config-typescript',
        '@vue/eslint-config-prettier',
        'plugin:@typescript-eslint/recommended',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 'latest',
        parser: '@typescript-eslint/parser',
        sourceType: 'module',
    },
    overrides: [
        {
            // 仅对 .vue 文件进行检查
            files: ['*.vue'],
            parser: 'vue-eslint-parser',
            parserOptions: {
                parser: '@typescript-eslint/parser',
                extraFileExtensions: ['.vue'],
            },
            rules: {
                'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
                'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
                // // 不准使用 ts 的 any
                '@typescript-eslint/no-explicit-any': 'off',
                endOfLine: 'off', // 自动适配换行符，跳过 ␍ 检查
                // // 不准定义没有使用的变量
                '@typescript-eslint/no-unused-vars': 'off',
                'vue/multi-word-component-names': 'off',
                'prettier/prettier': ['error', { endOfLine: 'auto' }],
                indent: ['error', 4],
                'max-lines': ['error', 1500],
                // 'require-jsdoc': [
                //     'error',
                //     {
                //         require: {
                //             FunctionDeclaration: true,
                //             MethodDefinition: true,
                //             ClassDeclaration: true,
                //             ArrowFunctionExpression: false,
                //         },
                //     },
                // ],
            },
        },
    ],
    rules: {
        'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        // 不准使用 ts 的 any
        '@typescript-eslint/no-explicit-any': 'off',
        // 不准定义没有使用的变量
        '@typescript-eslint/no-unused-vars': 'off',
        endOfLine: 'off', // 自动适配换行符，跳过 ␍ 检查
        // 'vue/multi-word-component-names': 'off',
        indent: ['error', 4],
        'max-lines': ['error', 1500],
        // 'require-jsdoc': [
        //     'error',
        //     {
        //         require: {
        //             FunctionDeclaration: true,
        //             MethodDefinition: true,
        //             ClassDeclaration: true,
        //             ArrowFunctionExpression: false,
        //         },
        //     },
        // ],
    },
}
