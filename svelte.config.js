const { preprocess, createEnv, readConfigFile } = require('@pyoner/svelte-ts-preprocess');

const env = createEnv();
const compilerOptions = readConfigFile(env);
const opts = {
    env,
    compilerOptions: {
        ...compilerOptions,
        allowNonTsExtensions: true,
    },
};

module.exports = {
    preprocess: preprocess(opts),
};