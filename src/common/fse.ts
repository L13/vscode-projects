//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import type { WalkTreeJob, WalkTreeOptions } from '../@types/files';

import { createFindGlob } from '../@l13/fse';

import { getPath, getUri } from './uris';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________


export async function exists (pathOrUri: string|vscode.Uri) {
	
	const uri = getUri(pathOrUri);
	
	try {
		return uri.scheme === 'file' ? !!await vscode.workspace.fs.stat(uri) : false;
	} catch (error) {
		return false;
	}
	
}

// export async function stat (pathOrUri: string|vscode.Uri) {
	
// 	const uri = getUri(pathOrUri);
	
// 	try {
// 		return await vscode.workspace.fs.stat(uri);
// 	} catch (error) {
// 		return null;
// 	}
	
// }

export async function createDirectory (pathOrUri: string|vscode.Uri) {
	
	const uri = getUri(pathOrUri);
	
	await vscode.workspace.fs.createDirectory(uri);
	
}

export async function readDirectory (pathOrUri: string|vscode.Uri) {
	
	const uri = getUri(pathOrUri);
	
	return await vscode.workspace.fs.readDirectory(uri);
	
}

export async function readFile (pathOrUri: string|vscode.Uri, encoding?: string) {
	
	const uri = getUri(pathOrUri);
	const buffer = Buffer.from(await vscode.workspace.fs.readFile(uri));
	
	return encoding ? buffer.toString(encoding) : buffer;
	
}

export async function writeFile (pathOrUri: string|vscode.Uri, content: string|Buffer) {
	
	const uri = getUri(pathOrUri);
	const buffer = typeof content === 'string' ? Buffer.from(content) : content;
	
	await vscode.workspace.fs.writeFile(uri, buffer);
	
}

export async function unlink (pathOrUri: string|vscode.Uri) {
	
	const uri = getUri(pathOrUri);
	
	await vscode.workspace.fs.delete(uri);
	
}

export async function walkTree (pathOrUri: string|vscode.Uri, options: WalkTreeOptions) {
	
	const uri = getUri(pathOrUri);
	const findIgnore = Array.isArray(options.ignore) ? createFindGlob(options.ignore) : null;
	const maxDepth = options.maxDepth || 0;
	
	const job: WalkTreeJob = {
		find: options.find,
		type: options.type || 'folder',
		ignore: findIgnore,
		result: {
			root: getPath(uri),
			uris: [],
		},
		done: options.done,
	};
	
	try {
		await _walkTree(uri, job, maxDepth);
		if (job.done) job.done(null, job.result);
	} catch (error) {
		if (job.done) job.done(error, job.result);
	}
	
	return job.result;
	
}

//	Functions __________________________________________________________________

async function _walkTree (cwd: vscode.Uri, job: WalkTreeJob, depth: number) {
	
	const names = await vscode.workspace.fs.readDirectory(cwd);
	
	for (const [name, type] of names) {
		if (job.ignore?.test(name)) continue;
		switch (type) {
			case vscode.FileType.Directory:
				if (job.type === 'subfolder') {
					job.result.uris.push(vscode.Uri.joinPath(cwd, name));
				} else if (job.type === 'folder' && job.find.test(name)) {
					job.result.uris.push(cwd);
				} else if (depth > 0) await _walkTree(vscode.Uri.joinPath(cwd, name), job, depth - 1);
				break;
			case vscode.FileType.File:
				if (job.type === 'file' && job.find.test(name)) {
					job.result.uris.push(vscode.Uri.joinPath(cwd, name));
				}
				break;
		}
	}
	
}