//	Imports ____________________________________________________________________

import * as vscode from 'vscode';
import { getPath } from './uris';

//	Variables __________________________________________________________________

// eslint-disable-next-line no-useless-escape
const findPlaceholder = /^\$\{workspaceFolder(?:\:((?:\\\}|[^\}])*))?\}/;
const findEscapedEndingBrace = /\\\}/g;

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function parsePredefinedVariable (pathname: string) {
	
	return pathname.replace(findPlaceholder, function (match, name: string) {
		
		const workspaceFolders = vscode.workspace.workspaceFolders;
		
		if (!workspaceFolders) return match;
		
		if (!name) return getPath(workspaceFolders[0].uri);
		
		name = name.replace(findEscapedEndingBrace, '}');
		
		for (const workspaceFolder of workspaceFolders) {
			if (workspaceFolder.name === name) return getPath(workspaceFolder.uri);
		}
		
		return match;
		
	});
	
}

//	Functions __________________________________________________________________

