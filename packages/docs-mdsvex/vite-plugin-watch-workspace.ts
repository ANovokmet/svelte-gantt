import type { Plugin } from 'vite';
import debug from 'debug';
import fg from 'fast-glob';
import fs from 'fs';
import path from 'node:path';
import ts from 'typescript';
import YAML from 'yaml';

type TsConfigPath = string;

type FilePath = string;

type ExternalFile<Key extends PropertyKey, Value> = [Key, Value];

type ExternalFiles = Record<FilePath, TsConfigPath>;

type VitePluginWatchExternalOptions = {
	// path
	workspaceRoot: string;
	// path or glob
	currentPackage: string;
	format: 'esm' | 'cjs';
	// file types to build
	fileTypes?: string[];
	// glob patterns to ignore
	ignorePaths?: string[];
};

const log = debug(`vite-plugin-watch-workspace`);

const FILE_TYPES = ['ts', 'tsx'];

const RELATIVE_PATH_REGEX = /(\.+\/)*/;

const getTsConfigFollowExtends = (filename: string, rootDir?: string): { [key: string]: any } => {
	let extendedConfig: { [key: string]: any } = {};
	const config = ts.readConfigFile(filename, ts.sys.readFile).config;
	if (config.extends) {
		const importPath = path.resolve(rootDir || '', config.extends);
		const newRootDir = path.dirname(importPath);
		extendedConfig = getTsConfigFollowExtends(importPath, newRootDir);
	}
	return {
		...extendedConfig,
		...config,
		compilerOptions: {
			...extendedConfig.compilerOptions,
			...config.compilerOptions
		}
	};
};

const getFilesAndTsConfigs = async (
	workspacePath: string,
	currentPackage: string,
	packageDir: string,
	fileTypes: string[],
	ignorePaths?: string[]
): Promise<ExternalFile<FilePath, TsConfigPath>[]> => {
	const packagePath = path.resolve(workspacePath, packageDir);
	const tsConfigPath = path.resolve(packagePath, 'tsconfig.json');
	// check whether the user has passed a glob
	const currentPackageGlob = currentPackage.includes('*')
		? currentPackage
		: `${currentPackage}/**/*`;
	const tsconfig = getTsConfigFollowExtends(tsConfigPath);
	const rootDir = tsconfig.compilerOptions.rootDir;
	const files = await fg(path.resolve(packagePath, `${rootDir}/**/*.(${fileTypes.join('|')})`), {
		ignore: ['**/node_modules/**', currentPackageGlob, ...(ignorePaths || [])]
	});
	// keep the tsconfig path beside each file to avoid looking for file ids in arrays later
	return files.map((file: string) => [file, tsConfigPath]);
};

const getExternalFileLists = async (
	workspaceRoot: string,
	currentPackage: string,
	fileTypes: string[],
	ignorePaths?: string[]
): Promise<ExternalFiles> => {
	// const workspacePackageJson = path.resolve(workspaceRoot, 'package.json')
	const workspacePnpmYaml = path.resolve(workspaceRoot, 'pnpm-workspace.yaml');
	// const workspaces = JSON.parse(fs.readFileSync(workspacePackageJson, 'utf8')).workspaces;
	const workspaces = YAML.parse(fs.readFileSync(workspacePnpmYaml, 'utf8')).packages;
	log(workspaces);
	const externalFiles: ExternalFiles = {};
	const filesConfigs: ExternalFile<FilePath, TsConfigPath>[] = (
		await Promise.all(
			workspaces.map(async (workspace: string) => {
				// get directories in each workspace
				const workspacePath = path.resolve(workspaceRoot, workspace.replace('*', ''));
				log(workspacePath);
				// get directories in workSpacePath
				const packages = fs
					.readdirSync(workspacePath)
					.filter((dir) => fs.lstatSync(path.join(workspacePath, dir)).isDirectory());
				log(packages);
				// get files and tsconfigs in each package
				return await Promise.all(
					packages.map(
						async (packageDir: string) =>
							await getFilesAndTsConfigs(
								workspacePath,
								currentPackage,
								packageDir,
								fileTypes,
								ignorePaths
							)
					)
				);
			})
		)
	).flatMap((filesConfigs) => filesConfigs.flat());
	filesConfigs.map(([file, tsconfig]) => (externalFiles[file] = tsconfig));
	return externalFiles;
};

const getLoader = (fileExtension: string) => {
	switch (fileExtension) {
		case '.ts':
			return 'ts';
		case '.tsx':
			return 'tsx';
		case '.js':
			return 'js';
		case '.jsx':
			return 'jsx';
		case '.css':
			return 'css';
		case '.json':
			return 'json';
		default:
			return 'ts';
	}
};

const getOutExtension = (fileExtension: string) => {
	switch (fileExtension) {
		case '.css':
			return '.css';
		case '.json':
			return '.json';
		case '.ts':
		case '.tsx':
		case '.js':
		case '.jsx':
		default:
			return '.js';
	}
};

const getOutDir = (file: string, tsconfig: { [key: string]: any }) => {
	const rootFolder = tsconfig.compilerOptions.rootDir.replace(RELATIVE_PATH_REGEX, '');
	const outFolder = tsconfig.compilerOptions.outDir
		? tsconfig.compilerOptions.outDir.replace(RELATIVE_PATH_REGEX, '')
		: '';
	return path.dirname(file).replace(rootFolder, outFolder);
};

const getOutFile = (outdir: string, file: string, fileExtension: string) => {
	const outExtension = getOutExtension(fileExtension);
	return path.resolve(outdir, path.basename(file).replace(fileExtension, outExtension));
};

/**
 * Plugin to watch a workspace for changes and rebuild when detected using esbuild
 * @param config
 * The config contains the following parameters
 *  - workspaceRoot: path to the root of the workspace
 *  - currentPackage: path to the current package or glob. Will be transformed to a glob if a path is passed.
 *  - format: esm | cjs
 *  - fileTypes: ts | tsx | js | jsx | ... (optional)
 *  - ignorePaths: paths or globs to ignore (optional)
 * @constructor
 */
console.log('load');
export async function VitePluginWatchWorkspace(
	config: VitePluginWatchExternalOptions
): Promise<Plugin<any>> {
	const externalFiles = await getExternalFileLists(
		config.workspaceRoot,
		config.currentPackage,
		config.fileTypes || FILE_TYPES,
		config.ignorePaths
	);
	return {
		name: 'vite-plugin-watch-workspace',
		async buildStart() {
			Object.keys(externalFiles).map((file) => {
				this.addWatchFile(file);
			});
		},
		async handleHotUpdate({ file, server, modules, timestamp }) {
			log(`File', ${file}`);

			const tsconfigPath = externalFiles[file];
			if (!tsconfigPath) {
				log(`tsconfigPath not found for file ${file}`);
				return;
			}
			const tsconfig = getTsConfigFollowExtends(tsconfigPath);
			const fileExtension = path.extname(file);
			const loader = getLoader(fileExtension);
			const outdir = getOutDir(file, tsconfig);
			const outfile = getOutFile(outdir, file, fileExtension);
			log(`Outfile ${outfile}, loader ${loader}`);

			server.hot.send({
				type: 'update',
				updates: modules.map((mod) => ({
					type: mod.url.includes('.css') ? 'css-update' : 'js-update',
					path: mod.url, // file==id, url (real)
					acceptedPath: mod.url,
					timestamp
				}))
			});
			return [];
		}
	};
}
