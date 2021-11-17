const fs = require('fs');
const del = require('del');
const rollup = require('rollup');
const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const pkg = require('../package.json');
const sveltePreprocess = require('svelte-preprocess');

const svelte = require('rollup-plugin-svelte');
const uglify = require('rollup-plugin-uglify');
const typescript = require('rollup-plugin-typescript2');

let promise = Promise.resolve();

// Clean up the output directory
const outputDir = './dist';

if (!fs.existsSync(outputDir)){
    fs.mkdirSync(outputDir);
} else {
    promise = promise.then(() => del([`${outputDir}/*`]));
}

promise = promise.then(() => rollup.rollup({
    input: './src/index.ts',
    external: Object.keys(pkg.dependencies),
    plugins: [
        svelte({
            dev: false,
            css: css => {
                css.write(`${outputDir}/css/svelteGantt.css`);
            },
            preprocess: sveltePreprocess()
        }),
        resolve(),
        commonjs(),
        typescript({ 
            useTsconfigDeclarationDir: true,
            tsconfigOverride: { 
                compilerOptions: {
                    declarationDir: `${outputDir}/types`,  
                } 
            }
        }),
    ],
}));

// Compile source code into a distributable format
['es', 'iife'].forEach(format => { // /*, 'cjs', 'umd'*/
    promise.then(bundle => bundle.write({
		file: `${outputDir}/${format === 'es' ? 'index' : `index.${format}`}.js`,
        sourcemap: true,
		format,
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
    
    fs.writeFileSync(`${outputDir}/package.json`, JSON.stringify(pkg, null, '  '), { encoding: 'utf-8', flag: 'w' });
    fs.writeFileSync(`${outputDir}/LICENSE.txt`, fs.readFileSync('./LICENSE.txt', 'utf-8'), { encoding: 'utf-8', flag: 'w' });
    fs.writeFileSync(`${outputDir}/README.md`, fs.readFileSync('./README.md', 'utf-8'), { encoding: 'utf-8', flag: 'w' });
});

promise.catch(err => console.error(err.stack)); // eslint-disable-line no-console