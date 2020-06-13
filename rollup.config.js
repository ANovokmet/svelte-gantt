import svelte from 'rollup-plugin-svelte';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import uglify from 'rollup-plugin-uglify';
import typescript from 'rollup-plugin-typescript2';

const production = !process.env.ROLLUP_WATCH;

import pkg from './package.json';

export default {
    input: 'src/index.ts',
    external: Object.keys(pkg.dependencies),
    output: {
        sourcemap: true,
        format: 'iife',
        name: 'app',
        file: 'public/dist/lib.js',
        globals: {
            moment: 'moment'
        }
    },
    plugins: [
        svelte({
            dev: !production,
            css: css => {
                css.write('public/dist/svelteGantt.css');
            }
        }),
        resolve(),
        commonjs(),
        typescript(),
        production && uglify()
    ],
}
