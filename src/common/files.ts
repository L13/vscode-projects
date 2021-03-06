//	Imports ____________________________________________________________________

import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

import { remove } from '../@l13/arrays';
import { isMacOs, isWindows } from '../@l13/platforms';

import * as settings from './settings';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function open (pathname:string, openInNewWindow?:boolean) {
	
	const newWindow = openInNewWindow ?? settings.get('openInNewWindow', false);
	
	vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(pathname), newWindow);
	
}

export function openAll (pathnames:string[], openInNewWindow?:boolean) {
	
	const newWindow = openInNewWindow ?? settings.get('openInNewWindow', false);
	const sortedPaths = pathnames.slice().sort();
	let currentWorkspacePath = settings.getCurrentWorkspacePath();
	
	if (!newWindow) {
		if (sortedPaths.includes(currentWorkspacePath)) remove(sortedPaths, currentWorkspacePath);
		else currentWorkspacePath = sortedPaths.shift();
		sortedPaths.forEach((pathname) => open(pathname, true));
		open(currentWorkspacePath, false);
	} else sortedPaths.forEach((pathname) => open(pathname, true));
	
}
	
export function reveal (pathname:string) :void {
	
	if (fs.existsSync(pathname)) {
		let process:ChildProcessWithoutNullStreams = null;
	
		if (isMacOs) process = showFileInFinder(pathname);
		else if (isWindows) process = showFileInExplorer(pathname);
		else process = showFileInFolder(pathname);
		
		process.on('error', (error:Error) => {
			
			process.kill();
			vscode.window.showErrorMessage(error.message);
			
		});
	} else vscode.window.showErrorMessage(`Path "${pathname}" doesn't exist!`);
	
}

//	Functions __________________________________________________________________

function showFileInFinder (pathname:string) {
	
	return spawn('open', ['-R', pathname || '/']);
	
}

function showFileInExplorer (pathname:string) {
	
	return spawn('explorer', ['/select,', pathname || 'c:\\']);
	
}

function showFileInFolder (pathname:string) {
	
	return spawn('xdg-open', [path.dirname(pathname) || '/']);
	
}