//	Imports ____________________________________________________________________

const glob = require('glob');
const { ESLint } = require('eslint');
const rollup = require('rollup');

const typescript = require('@rollup/plugin-typescript');

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

module.exports = [
	{
		name: 'lint',
		task: async (done) => {
	
			const eslint = new ESLint();
			const results = await eslint.lintFiles(['src/**/*.ts']);
			const formatter = await eslint.loadFormatter('stylish');
			const resultText = formatter.format(results);
			
			if (resultText) console.log(resultText);
			
			done();
			
		},
	},
	{
		name: 'extension',
		watch: 'src/**/!(*.test).ts',
		task: () => {
			
			return build({
				input: 'src/extension.ts',
				file: 'out/extension.js',
				include: [
					'src/**/!(.test).ts',
				],
				external: [
					'fs',
					'jsonc-parser',
					'path',
					'vscode',
				],
			});
			
		},
	},
	{
		name: 'tests',
		watch: [
			'src/test/index.ts',
			'src/**/*.test.ts',
		],
		task: () => {
			
			const promises = [];
			
			[{ in: 'src/test/index.ts', out: 'test/index.js'}]
			.concat(createInOut('src/**/*.test.ts'))
			.forEach((file) => {
				
				promises.push(build({
					input: file.in,
					file: file.out,
					treeshake: false,
					include: [
						'src/**/*.ts',
					],
					external: [
						'assert',
						'glob',
						'fs',
						'mocha',
						'path',
					],
				}));
				
			});
			
			return Promise.all(promises);
			
		},
	},
];

//	Functions __________________________________________________________________

function createInOut (pattern) {
	
	return glob.sync(pattern).map((filename) => {
		
		return {
			in: filename,
			out: filename.replace(/^src/, 'test').replace(/\.ts$/, '.js'),
		};
		
	});
	
}

function onwarn (warning) {
	
	console.warn(warning.toString());
	
}

function onerror (error) {
	
	console.error(`Error:${error.pluginCode ? ' ' + error.pluginCode : ''} ${error.message} ${error.loc.file}:${error.loc.line}:${error.loc.column}`);
	
	throw error;
	
}

function build (config) {
	
	const external = config.external || [];
	
	return rollup.rollup({
		input: config.input,
		treeshake: config.treeshake ?? true,
		onwarn,
		external,
		plugins: [
			typescript({
				include: config.include,
			}),
		]
	}).then((bundle) => {
		
		return bundle.write({
			file: config.file,
			format: config.format || 'cjs',
			globals: config.globals || external.reduce((map, name) => {
				map[name] = name;
				return map;
			}, {}),
		});
		
	}, onerror);
	
}