//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class Settings {
	
	public static get (key:string, value?:any) {
		
		return vscode.workspace.getConfiguration('l13Projects').get(key, value);
		
	}
	
	public static update (key:string, value:any, global:boolean = true) {
		
		return vscode.workspace.getConfiguration('l13Projects').update(key, value, global);
		
	}
	
	public static getWorkspacePath () {
	
		const workspace = vscode.workspace;
		let uri:undefined|vscode.Uri = workspace.workspaceFile;
		
		if (!uri && workspace.workspaceFolders) uri = workspace.workspaceFolders[0].uri;
		
		return uri && uri.scheme !== 'untitled' ? uri.fsPath : '';
		
	}
	
}

//	Functions __________________________________________________________________

