const fs = require('fs');
const del = require('del');
const rollup = require('rollup');
const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const pkg = require('../package.json');

const svelte = require('rollup-plugin-svelte');
const uglify = require('rollup-plugin-uglify');
const typescript = require('rollup-plugin-typescript2');

let promise = Promise.resolve();

// Clean up the output directory
promise = promise.then(() => del(['dist/*']));

promise = promise.then(() => rollup.rollup({
    input: 'src/index.ts',
    external: Object.keys(pkg.dependencies),
    plugins: [
        svelte({
            dev: false,
            css: css => {
                css.write('dist/css/svelteGantt.css');
            }
        }),
        resolve(),
        commonjs(),
        typescript({ useTsconfigDeclarationDir: true }),
    ],
}));

// Compile source code into a distributable format
['es', 'iife'].forEach(format => { // /*, 'cjs', 'umd'*/
    promise.then(bundle => bundle.write({
		file: `dist/${format === 'es' ? 'index' : `index.${format}`}.js`,
        sourcemap: true,
		format,
        globals: { 
            moment: 'moment'
        },
        extend: format === 'iife',
		name: format === 'iife' ? 'window' : undefined // pkg.name : undefined,
	}));
});

// Copy package.json and LICENSE.txt
promise = promise.then(() => {
	delete pkg.private;
	delete pkg.devDependencies;
	delete pkg.scripts;
    delete pkg.eslintConfig;
    
    fs.writeFileSync('dist/package.json', JSON.stringify(pkg, null, '  '), { encoding: 'utf-8', flag: 'w' });
    fs.writeFileSync('dist/LICENSE.txt', fs.readFileSync('LICENSE.txt', 'utf-8'), { encoding: 'utf-8', flag: 'w' });
});

promise.catch(err => console.error(err.stack)); // eslint-disable-line no-console