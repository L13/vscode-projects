//	Imports ____________________________________________________________________

import * as fs from 'fs';
import * as vscode from 'vscode';

import { remove } from '../@l13/arrays';

import * as settings from './settings';
import { getCurrentWorkspacePath } from './workspaces';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function open (pathname:string, openInNewWindow?:boolean) {
	
	const newWindow = openInNewWindow ?? settings.openInNewWindow();
	
	vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(pathname), newWindow);
	
}

export function openAll (pathnames:string[], openInNewWindow?:boolean) {
	
	const newWindow = openInNewWindow ?? settings.openInNewWindow();
	const sortedPaths = pathnames.slice().sort();
	let currentWorkspacePath = getCurrentWorkspacePath();
	
	if (!newWindow) {
		if (sortedPaths.includes(currentWorkspacePath)) remove(sortedPaths, currentWorkspacePath);
		else currentWorkspacePath = sortedPaths.shift();
		sortedPaths.forEach((pathname) => open(pathname, true));
		open(currentWorkspacePath, false);
	} else sortedPaths.forEach((pathname) => open(pathname, true));
	
}
	
export function reveal (pathname:string) {
	
	if (fs.existsSync(pathname)) {
		vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(pathname));
	} else vscode.window.showErrorMessage(`Path "${pathname}" doesn't exist!`);
	
}

//	Functions __________________________________________________________________

