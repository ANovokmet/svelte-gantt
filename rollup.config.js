import svelte from 'rollup-plugin-svelte';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import uglify from 'rollup-plugin-uglify';
import sveltePreprocess from 'svelte-preprocess';
import typescript from '@rollup/plugin-typescript';

const production = !process.env.ROLLUP_WATCH;

import pkg from './package.json';

export default {
    input: 'src/index.ts',
    external: Object.keys(pkg.dependencies),
    output: {
        sourcemap: true,
        format: 'es',
        name: 'window',
        extend: true,
        dir: 'docs/dist',
        globals: {
            moment: 'moment'
        },
        // dir: 'dist'
    },
    plugins: [
        svelte({
            dev: !production,
            css: css => {
                css.write('docs/dist/svelteGantt.css');
            },
            preprocess: sveltePreprocess()
        }),
        resolve(),
        commonjs(),
        typescript(),
        production && uglify()
    ],
}
