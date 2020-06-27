//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class ProjectsSettings {
	
	public static get (key:string, value?:any) {
		
		return vscode.workspace.getConfiguration('l13Projects').get(key, value);
		
	}
	
	public static update (key:string, value:any, global:boolean = true) {
		
		return vscode.workspace.getConfiguration('l13Projects').update(key, value, global);
		
	}
	
}

//	Functions __________________________________________________________________

