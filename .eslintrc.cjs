module.exports = {
    root: true,
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:svelte/recommended',
    ],
    rules: {
        indent: ['warn', 4, { 'SwitchCase': 1 }],
        quotes: ['warn', 'single'],
        'prefer-rest-params': 'off',
        'svelte/valid-compile': 'off'
    },
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2020,
        extraFileExtensions: ['.svelte']
    },
    env: {
        browser: true,
        es2017: true,
        node: true
    },
    overrides: [
        {
            files: ['*.svelte'],
            parser: 'svelte-eslint-parser',
            parserOptions: {
                parser: '@typescript-eslint/parser'
            }
        }
    ]
};
