import fs from 'fs';
import del from 'del';
import path from 'path';
import { fileURLToPath } from 'url';

import { rollup as _rollup } from 'rollup';
import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
// import uglify from 'rollup-plugin-uglify';
import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';
import sveltePreprocess from 'svelte-preprocess';
import dts from 'rollup-plugin-dts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json')));

let promise = Promise.resolve();

// Clean up the output directory
const outputDir = './dist';

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
} else {
    promise = promise.then(() => del([`${outputDir}/*`]));
}

promise = promise.then(() =>
    _rollup({
        input: './src/index.ts',
        // external: Object.keys(pkg.dependencies),
        plugins: [
            svelte({
                // css: css => {
                //     css.write(`${outputDir}/css/svelteGantt.css`);
                // },
                emitCss: true,
                preprocess: sveltePreprocess()
            }),
            postcss(),
            resolve({
                browser: true
                // dedupe: ['svelte', 'svelte/internal'],
            }),
            commonjs(),
            typescript({
                compilerOptions: {
                    declarationDir: `${outputDir}/types`
                }
            })
        ]
    })
);

// Compile source code into a distributable format
promise = promise.then((bundle) => {
    return Promise.all(['es', 'iife'].map(format => {
        // /*, 'cjs', 'umd'*/
        return bundle.write({
            file: `${outputDir}/${format === 'es' ? 'index' : `index.${format}`}.js`,
            sourcemap: true,
            format,
            extend: format === 'iife',
            name: format === 'iife' ? 'window' : undefined // pkg.name : undefined,
        });
    })).then(() => bundle.close());
})

promise = promise.then(() => {
    return _rollup({
        input: `${outputDir}/types/src/index.d.ts`,
        plugins: [dts()],
    }).then((bundle) => bundle.write({
        file: `${outputDir}/index.d.ts`, 
        format: 'es'
    })).then(() => 
        del([`${outputDir}/types`])
    )
});

// Copy package.json and LICENSE.txt
promise = promise.then(() => {
    delete pkg.private;
    delete pkg.devDependencies;
    delete pkg.scripts;
    delete pkg.eslintConfig;

    pkg.peerDependencies.svelte = '^4.0.0';
    pkg.exports = {
        '.': {
            types: './index.d.ts',
            default: './index.js'
        },
        './svelte': {
            types: './svelte/index.d.ts',
            svelte: './svelte/index.js'
        }
    };

    fs.writeFileSync(`${outputDir}/package.json`, JSON.stringify(pkg, null, '  '), {
        encoding: 'utf-8',
        flag: 'w'
    });
    fs.writeFileSync(`${outputDir}/LICENSE.txt`, fs.readFileSync('./LICENSE.txt', 'utf-8'), {
        encoding: 'utf-8',
        flag: 'w'
    });
    fs.writeFileSync(`${outputDir}/README.md`, fs.readFileSync('./README.md', 'utf-8'), {
        encoding: 'utf-8',
        flag: 'w'
    });
});

promise.catch(err => console.error(err.stack)); // eslint-disable-line no-console
