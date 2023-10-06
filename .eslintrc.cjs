module.exports = {
    root: true,
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:svelte/recommended',
        'prettier'
    ],
    rules: {
        indent: ['warn', 4, { SwitchCase: 1 }],
        quotes: ['warn', 'single'],
        'prefer-rest-params': 'off',
        'svelte/valid-compile': 'off',
        'svelte/no-at-html-tags': 'off',
        '@typescript-eslint/no-unused-vars': [
            'error',
            {
                argsIgnorePattern: '_',
                varsIgnorePattern: '_',
                caughtErrorsIgnorePattern: '_'
            }
        ]
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
        },
        {
            files: ['src/**/*'],
            rules: {
                'no-console': ['error', { allow: ['warn', 'error'] }]
            }
        }
    ]
};
