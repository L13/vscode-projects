//	Imports ____________________________________________________________________

const fs = require('fs');
const glob = require('glob');

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

module.exports = [
	{
		name: 'fix',
		watch: [
			'src/**/*.svg',
			'images/**/*.svg',
		],
		task: (done) => {
	
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
	
		},
	},
	{
		name: 'colors',
		watch: [
			'images/**/?(current-)project-*-color-x-*.svg',
			'images/**/?(current-)remote-*-color-x-*.svg',
		],
		task: (done) => {
			
			[
				'images/**/?(current-)project-*-color-x-*.svg',
				'images/**/?(current-)remote-*-color-x-*.svg',
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
			
		},
	},
];

//	Functions __________________________________________________________________

