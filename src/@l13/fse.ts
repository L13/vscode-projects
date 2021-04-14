//	Imports ____________________________________________________________________

import * as fs from 'fs';
import * as path from 'path';

import { Callback, FileMap, Options, WalkTreeJob } from '../@types/files';

import { isWindows } from './platforms';

//	Variables __________________________________________________________________

// eslint-disable-next-line no-useless-escape
const findRegExpChars = /([\\\[\]\.\*\^\$\|\+\-\{\}\(\)\?\!\=\:\,])/g;

// eslint-disable-next-line no-control-regex, no-useless-escape
const findIllegalAndControlChars = /[\x00-\x1f"\*<>\?\|\x80-\x9f]/g;
const findColon = /:/g;

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function walkTree (cwd:string, options:Callback|Options, callback?:Callback) {
	
	callback = typeof options === 'function' ? options : callback;
	
	const findIgnore = Array.isArray((<Options>options).ignore) ? createFindGlob((<Options>options).ignore) : null;
	const maxDepth = (<Options>options).maxDepth || 0;
	
	const job:WalkTreeJob = {
		error: null,
		find: (<Options>options).find,
		type: (<Options>options).type || 'folder',
		ignore: findIgnore,
		result: {},
		tasks: 1,
		done: () => callback(null, job.result),
	};
	
	_walktree(job, cwd, maxDepth);
	
}

export function subfolders (cwd:string, options:Callback|Options, callback:Callback) {
	
	callback = typeof options === 'function' ? options : callback;
	
	const findIgnore = Array.isArray((<Options>options).ignore) ? createFindGlob((<Options>options).ignore) : null;
	
	fs.readdir(cwd, (error, names) => {
		
		if (error) return callback(error);
		
		const result:FileMap = {};
		
		if (findIgnore) names = names.filter((name) => !findIgnore.test(name));
					
		names.forEach((name) => {
			
			const pathname = path.join(cwd, name);
			const stat = fs.statSync(pathname);
			
			if (stat.isDirectory()) {
				result[pathname] = {
					folder: cwd,
					path: pathname,
					relative: name,
					type: 'folder',
				};
			}
			
		});
		
		callback(null, result);
		
	});
	
}

export function lstatSync (pathname:string) {
	
	try {
		return fs.lstatSync(pathname);
	} catch (error) {
		return null;
	}
	
}

export function createFindGlob (ignore:string[]) {
	
	return new RegExp(`^(${ignore.map((value) => escapeForRegExp(value)).join('|')})$`);
	
}

export function sanitize (pathname:string) {
	
	let name = `${pathname}`.replace(findIllegalAndControlChars, '');
	
	if (!isWindows) name = name.replace(findColon, '');
	
	return name;
	
}

//	Functions __________________________________________________________________

function escapeForRegExp (text:any) :string {
	
	return `${text}`.replace(findRegExpChars, (match) => {
		
		if (match === '*') return '.*';
		if (match === '?') return '.';
		
		return '\\' + match;
		
	});
	
}

function _walktree (job:WalkTreeJob, cwd:string, depth:number, relative = '') {
	
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
							path: path.dirname(pathname),
							relative,
							type: 'folder',
						};
					} else if (depth > 0) return _walktree(job, cwd, depth - 1, nextRelative);
				} else if (job.type === 'file' && stat.isFile() && job.find.test(name)) {
					job.result[pathname] = {
						folder: cwd,
						path: pathname,
						relative: nextRelative,
						type: 'file',
					};
				}
				
				job.tasks--;
				
				if (!job.tasks) job.done();
				
			});
			
		});
		
	});
	
}