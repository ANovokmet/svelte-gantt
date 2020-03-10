import svelte from 'rollup-plugin-svelte';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import buble from 'rollup-plugin-buble';
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
        extend: true,
        name: 'window',
        file: 'public/dist/lib.js',
        globals: {
            moment: 'moment'
        }
    },
    plugins: [
        svelte({
            skipIntroByDefault: true,
            nestedTransitions: true,
            dev: !production,
            css: css => {
                css.write('public/dist/svelteGantt.css');
            }
        }),
        typescript({
            tsconfigOverride: {
                compilerOptions: { declaration: false }
            }
        }),
        commonjs(),
        resolve(),
        production && buble({ include: ['src/**', 'node_modules/svelte/shared.js'] }),
        production && uglify()
    ],
}
