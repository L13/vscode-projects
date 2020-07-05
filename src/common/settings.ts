//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

//	Variables __________________________________________________________________

// const findExtWorkspace = /\.code-workspace$/;

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function get (key:string, value?:any) {
	
	return vscode.workspace.getConfiguration('l13Projects').get(key, value);
	
}
	
export function update (key:string, value:any, global:boolean = true) {
	
	return vscode.workspace.getConfiguration('l13Projects').update(key, value, global);
	
}
	
export function  getWorkspacePath () {
	
	const workspace = vscode.workspace;
	let uri:undefined|vscode.Uri = workspace.workspaceFile;
	
	if (!uri && workspace.workspaceFolders) uri = workspace.workspaceFolders[0].uri;
	
	return uri && uri.scheme !== 'untitled' ? uri.fsPath : '';
	
}

// export function isWorkspace (workspacePath:string) {
	
// 	return findExtWorkspace.test(workspacePath);
	
// }

//	Functions __________________________________________________________________

