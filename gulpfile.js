//	Imports ____________________________________________________________________

const del = require('del');

const fs = require('fs');
const glob = require('glob');
const gulp = require('gulp');
const rollup = require('rollup');
const typescript = require('rollup-plugin-typescript');

//	Variables __________________________________________________________________

const findPattern = /width="100%" height="100%" viewBox="0 0 (\d+) (\d+)"/;

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

gulp.task('clean', () => {
	
	return del(['out']);
	
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

gulp.task('script', () => {
	
	return rollup.rollup({
		input: 'src/extension.ts',
		external: [
			'child_process',
			'fs',
			'jsonc-parser',
			'path',
			'vscode',
		],
		plugins: [
			typescript({
				target: 'es6',
				lib: [
					'es6',
					'dom',
				],
				strict: true,
				removeComments: true,
			}),
		]
	}).then(bundle => {
		
		return bundle.write({
			file: './out/extension.js',
			format: 'cjs',
			globals: {
				child_process: 'child_process',
				fs: 'fs',
				jsoncParser: 'jsonc-parser',
				path: 'path',
				vscode: 'vscode',
			},
		});
		
	});
	
});

gulp.task('build', gulp.series('clean', 'icons:fix', 'script'));

gulp.task('watch', () => {
	
	gulp.watch([
		'src/**/*.svg',
		'images/**/*.svg',
	], gulp.parallel('icons:fix'));
	
	gulp.watch(['src/**/*.ts'], gulp.parallel('script'));
	
});

gulp.task('build & watch', gulp.series('build', 'watch'));

//	Functions __________________________________________________________________

