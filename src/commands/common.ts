//	Imports ____________________________________________________________________

import { spawn } from 'child_process';
import * as path from 'path';
import * as vscode from 'vscode';

import { getWorkspacePath } from '../services/common';

import { Project } from '../services/types';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function activate (context:vscode.ExtensionContext) {
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.openInNewWindow', (uri) => {
		
		vscode.commands.executeCommand('vscode.openFolder', uri, true);
		
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.openInCurrentWindow', (uri) => {
		
		vscode.commands.executeCommand('vscode.openFolder', uri, false);
		
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.showProjectInFinder', (item) => {
		
		showFileInFinder(item ? item.project.path : getWorkspacePath());
		
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.showProjectInExplorer', (item) => {
		
		showFileInExplorer(item ? item.project.path : getWorkspacePath());
		
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.showProjectInFolder', (item) => {
		
		showFileInFolder(item ? item.project.path : getWorkspacePath());
		
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.openInTerminal', ({ project }) => {
		
		openTerminalWithFolder(project);
		
	}));

}

//	Functions __________________________________________________________________

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

function getFolderPath (project:Project) {
	
	return project.type === 'folders' || project.type === 'workspace' ? path.dirname(project.path) : project.path;
	
}