//	Imports ____________________________________________________________________

import * as fs from 'fs';
import * as path from 'path';

import { Callback, Options, WalkTreeJob } from '../../types';

//	Variables __________________________________________________________________

const findRegExpChars:RegExp = /([\\\[\]\.\*\^\$\|\+\-\{\}\(\)\?\!\=\:\,])/g;

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function walktree (cwd:string, options:Callback|Options, callback?:Callback) {
	
	callback = typeof options === 'function' ? options : callback;
	
	const findIgnore = Array.isArray((<Options>options).ignore) ? createFindGlob((<string[]>(<Options>options).ignore)) : null;
	const maxDepth = (<Options>options).maxDepth || 0;
	
	const job:WalkTreeJob = {
		error: null,
		find: (<Options>options).find,
		type: (<Options>options).type || 'folder',
		ignore: findIgnore,
		result: {},
		tasks: 1,
		done: () => (<Callback>callback)(null, job.result),
	};
	
	_walktree(job, cwd, maxDepth);
	
}

export function createFindGlob (ignore:string[]) {
	
	return new RegExp(`^(${ignore.map((value) => escapeForRegExp(value)).join('|')})$`);
	
}

//	Functions __________________________________________________________________

function escapeForRegExp (text:any) :string {
	
	return ('' + text).replace(findRegExpChars, (match) => {
		
		if (match === '*') return '.+';
		if (match === '?') return '?';
		
		return '\\' + match;
		
	});
	
}

function _walktree (job:WalkTreeJob, cwd:string, depth:number, relative:string = '') {
	
	const dirname = path.join(cwd, relative);
	
	fs.readdir(dirname, (dirError, names) => {
		
		job.tasks--; // directory read
		
		if (dirError) {
			if (!job.tasks) job.done();
			return;
		}
		
		const ignore = job.ignore;
		
		if (ignore) names = names.filter((name) => !ignore.test(name));
		
		job.tasks += names.length;
		
		if (!job.tasks) return job.done();
		
		names.forEach((name) => {
			
			const pathname = path.join(dirname, name);
			
			if (job.result[pathname]) return job.tasks--;
			
			fs.lstat(pathname, (statError, stat) => {
				
				if (statError) {
					job.tasks--;
					if (!job.tasks) job.done();
					return;
				}
				
				const nextRelative = path.join(relative, name);
				
				if (stat.isDirectory()) {
					if (job.type === 'folder' && job.find.test(name)) {
						job.result[pathname] = {
							folder: cwd,
							path: pathname,
							relative: nextRelative,
							stat,
							type: 'folder',
						};
					} else if (depth > 0) return _walktree(job, cwd, depth - 1, nextRelative);
				} else if (job.type === 'file' && stat.isFile() && job.find.test(name)) {
					job.result[pathname] = {
						folder: cwd,
						path: pathname,
						relative: nextRelative,
						stat,
						type: 'file',
					};
				}
				
				job.tasks--;
				
				if (!job.tasks) job.done();
				
			});
			
		});
		
	});
	
}