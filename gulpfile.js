//	Imports ____________________________________________________________________

const child_process = require('child_process');
const del = require('del');
const fs = require('fs');
const glob = require('glob');
const gulp = require('gulp');
const { ESLint } = require('eslint');
const rollup = require('rollup');

const typescript = require('@rollup/plugin-typescript');

//	Variables __________________________________________________________________

const findPattern = /width="100%" height="100%" viewBox="0 0 (\d+) (\d+)"/;

const colorsLight = [
	null,
	[143, 66, 170], // purple
	[1, 120, 207], // blue
	[50, 126, 54], // green
	[187, 170, 73], // yellow
	[206, 126, 28], // orange
	[214, 63, 38], // red
	[133, 133, 133], // grey
];

const colorsDark = [
	null,
	[143, 66, 170], // purple
	[1, 120, 207], // blue
	[50, 126, 54], // green
	[187, 170, 73], // yellow
	[206, 126, 28], // orange
	[214, 63, 38], // red
	[133, 133, 133], // grey
];

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

gulp.task('clean', () => {
	
	return del(['out', 'test']);
	
});

gulp.task('icons:fix', (done) => {
	
	[
		'src/**/*.svg',
		'images/**/*.svg',
	].forEach((globPattern) => {
		
		glob.sync(globPattern).forEach((filename) => {
			
			let content = fs.readFileSync(filename, 'utf-8');
			
			if (findPattern.test(content)) {
				content = content.replace(findPattern, (match, width, height) => {
					
					return `width="${width}px" height="${height}px" viewBox="0 0 ${width} ${height}"`;
					
				});
				fs.writeFileSync(filename, content, 'utf-8');
			}
			
		});
		
	});
	
	done();
	
});

gulp.task('icons:colors', (done) => {
	
	[
		'images/**/?(current-)project-*-color-x-*.svg',
	].forEach((globPattern) => {
		
		glob.sync(globPattern).forEach((filename) => {
			
			const content = fs.readFileSync(filename, 'utf-8');
			const colors = filename.includes('-light.svg') ? colorsLight : colorsDark;
			
			for (let i = 1; i < colors.length; i++) {
				const iconContent = content.replace('fill:white;', `fill:rgb(${colors[i].join(',')});`);
				const colorFilename = filename.replace('-x-', `-${i}-`);
				const exists = fs.existsSync(colorFilename);
				if (!exists || exists && iconContent !== fs.readFileSync(colorFilename, 'utf-8')) {
					fs.writeFileSync(colorFilename, iconContent, 'utf-8');
				}
			}
			
		});
		
	});
	
	done();
	
});

gulp.task('icons', gulp.series('icons:fix', 'icons:colors'));

gulp.task('script:extension', () => {
	
	return rollup.rollup({
		input: 'src/extension.ts',
		onwarn,
		external: [
			'fs',
			'jsonc-parser',
			'path',
			'vscode',
		],
		plugins: [
			typescript({
				include: [
					'src/**/!(*.test).ts',
				],
			}),
		]
	}).then(bundle => {
		
		return bundle.write({
			file: 'out/extension.js',
			format: 'cjs',
			globals: {
				fs: 'fs',
				jsoncParser: 'jsonc-parser',
				path: 'path',
				vscode: 'vscode',
			},
		});
		
	}, onerror);
	
});

gulp.task('script:tests', () => {
	
	const promises = [];
	
	[{ in: 'src/test/index.ts', out: 'test/index.js'}]
	.concat(createInOut('src/**/*.test.ts'))
	.forEach((file) => {
		
		promises.push(rollup.rollup({
			input: file.in,
			treeshake: false,
			onwarn,
			external: [
				'assert',
				'glob',
				'fs',
				'mocha',
				'path',
			],
			plugins: [
				typescript({
					include: [
						'src/@l13/**/*.ts',
						'src/test/index.ts',
					],
				}),
			]
		}).then(bundle => {
			
			return bundle.write({
				file: file.out,
				format: 'cjs',
				globals: {
					assert: 'assert',
					glob: 'glob',
					fs: 'fs',
					mocha: 'mocha',
					path: 'path',
				},
			});
			
		}, onerror));
		
	});
	
	return Promise.all(promises);
	
});

gulp.task('lint', async (done) => {
	
	const eslint = new ESLint();
	const results = await eslint.lintFiles(['src/**/*.ts']);
	const formatter = await eslint.loadFormatter('stylish');
	const resultText = formatter.format(results);
	
	if (resultText) console.log(resultText);
	
	done();
	
});

gulp.task('test', (done) => {
	
	const tests = child_process.spawn('npm', ['test']).on('close', () => done());
	
	let logger = (buffer) => buffer.toString().split(/\n/).forEach((message) => message && console.log(message));
	
	tests.stdout.on('data', logger);
	tests.stderr.on('data', logger);
	
});

gulp.task('script', gulp.series('script:extension', 'script:tests'));

gulp.task('build', gulp.series('clean', 'icons', 'script', 'lint', 'test'));

gulp.task('watch', () => {
	
	gulp.watch([
		'src/**/*.svg',
		'images/**/*.svg',
	], gulp.parallel('icons:fix'));
	
	gulp.watch([
		'images/**/?(current-)project-*-color-x-*.svg',
	], gulp.parallel('icons:colors'));
	
	gulp.watch([
		'src/**/!(*.test).ts',
	], gulp.parallel('script:extension'));
	
	gulp.watch([
		'src/test/index.ts',
		'src/**/*.test.ts',
	], gulp.series('script:tests', 'test'));
	
});

gulp.task('build & watch', gulp.series('build', 'watch'));

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