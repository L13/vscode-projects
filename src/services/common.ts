//	Imports ____________________________________________________________________

import { spawn } from 'child_process';
import * as path from 'path';
import * as vscode from 'vscode';

import { Project } from './types';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function workspacePaths (workspaceFolders:vscode.WorkspaceFolder[]|undefined) {
	
	return (workspaceFolders || []).map((item:vscode.WorkspaceFolder) => item.uri.fsPath);
	
}

export function getWorkspacePath () {
	
	const workspace = vscode.workspace;
	let uri:undefined|vscode.Uri = workspace.workspaceFile;
	
	if (!uri && workspace.workspaceFolders) uri = workspace.workspaceFolders[0].uri;
	
	return uri && uri.scheme !== 'untitled' ? uri.fsPath : '';
	
}

export function sortCaseInsensitive (a:string, b:string) {
					
	a = a.toLowerCase();
	b = b.toLowerCase();
	
	return a < b ? -1 : a > b ? 1 : 0;
	
}

export function showFileInFinder (pathname:string) {
	
	const process = spawn('open', ['-R', pathname || '/']);
	
	process.on('error', (error:Error) => {
		
		process.kill();
		vscode.window.showErrorMessage(error.message);
		
	});
	
}

export function showFileInExplorer (pathname:string) {
	
	const process = spawn('explorer', ['/select,', pathname || 'c:\\']);
	
	process.on('error', (error:Error) => {
		
		process.kill();
		vscode.window.showErrorMessage(error.message);
		
	});
	
}

export function showFileInFolder (pathname:string) {
	
	const process = spawn('xdg-open', [path.dirname(pathname) || '/']);
	
	process.on('error', (error:Error) => {
		
		process.kill();
		vscode.window.showErrorMessage(error.message);
		
	});
	
}

export function openTerminalWithFolder (project:Project) {
	
	vscode.window.createTerminal({ cwd: getFolderPath(project) }).show();
	
}

export function getFolderPath (project:Project) {
	
	return project.type === 'folders' || project.type === 'workspace' ? path.dirname(project.path) : project.path;
	
}

//	Functions __________________________________________________________________

