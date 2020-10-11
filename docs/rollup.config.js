import svelte from 'rollup-plugin-svelte';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import * as path from 'path';


import pkg from '../package.json';

export default {
    input: path.join(__dirname, 'src/index.js'),
    external: Object.keys(pkg.dependencies),
    output: {
        sourcemap: true,
        format: 'iife',
        name: 'app',
        file: path.join(__dirname, 'public/index.js'),
        globals: {
            moment: 'moment'
        }
    },
    plugins: [
        svelte({
            dev: true,
            css: css => {
                css.write(path.join(__dirname, 'public/index.css'));
            }
        }),
        resolve(),
        commonjs()
    ],
}
