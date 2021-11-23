import svelte from 'rollup-plugin-svelte';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import * as path from 'path';

export default {
    input: path.join(__dirname, 'src/index.js'),
    output: {
        sourcemap: true,
        format: 'iife',
        name: 'app',
        file: path.join(__dirname, '../docs/build/index.js')
    },
    plugins: [
        svelte({
            dev: true,
            emitCss: false,
            css: css => {
                css.write(path.join(__dirname, '../docs/build/index.css'));
            }
        }),
        resolve(),
        commonjs()
    ],
}
