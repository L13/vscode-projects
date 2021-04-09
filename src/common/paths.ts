//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

//	Variables __________________________________________________________________

const findPlaceholder = /^\$\{workspaceFolder(?:\:((?:\\\}|[^\}])*))?\}/;
const findEscapedEndingBrace = /\\\}/g;

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function parsePredefinedVariable (pathname:string) {
	
	return pathname.replace(findPlaceholder, function (match, name:string) {
		
		const workspaceFolders = vscode.workspace.workspaceFolders;
		
		if (!workspaceFolders) return match;
		
		if (!name) return workspaceFolders[0].uri.fsPath;
		
		name = name.replace(findEscapedEndingBrace, '}');
		
		for (const workspaceFolder of workspaceFolders) {
			if (workspaceFolder.name === name) return workspaceFolder.uri.fsPath;
		}
		
		return match;
		
	});
	
}

//	Functions __________________________________________________________________

