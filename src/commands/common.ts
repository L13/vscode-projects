//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { getWorkspacePath, openTerminalWithFolder, showFileInExplorer, showFileInFinder, showFileInFolder } from '../services/common';

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

