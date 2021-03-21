//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export const findExtWorkspace = /\.code-workspace$/;

export function isCodeWorkspace (workspacePath:string) {
		
	return findExtWorkspace.test(workspacePath);
	
}
	
export function getCurrentWorkspacePath () {
	
	const workspace = vscode.workspace;
	let uri:undefined|vscode.Uri = workspace.workspaceFile;
	
	if (!uri && workspace.workspaceFolders) uri = workspace.workspaceFolders[0].uri;
	
	return uri && uri.scheme !== 'untitled' ? uri.fsPath : '';
	
}

//	Functions __________________________________________________________________

