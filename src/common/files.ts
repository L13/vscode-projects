//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { remove } from '../@l13/arrays';

import * as fse from './fse';
import * as settings from './settings';
import { createUri } from './uris';
import { getCurrentWorkspacePath } from './workspaces';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function open (pathname: string, openInNewWindow?: boolean) {
	
	if (!pathname) return;
	
	const newWindow = openInNewWindow ?? settings.openInNewWindow();
	
	vscode.commands.executeCommand('vscode.openFolder', createUri(pathname), newWindow);
	
}

export function openAll (pathnames: string[], openInNewWindow?: boolean) {
	
	const newWindow = openInNewWindow ?? settings.openInNewWindow();
	const sortedPaths = pathnames.slice().sort();
	let currentWorkspacePath = getCurrentWorkspacePath();
	
	if (!newWindow) {
		if (currentWorkspacePath && sortedPaths.includes(currentWorkspacePath)) remove(sortedPaths, currentWorkspacePath);
		else currentWorkspacePath = sortedPaths.shift();
		sortedPaths.forEach((pathname) => open(pathname, true));
		open(currentWorkspacePath, false);
	} else sortedPaths.forEach((pathname) => open(pathname, true));
	
}
	
export async function reveal (pathname: string) {
	
	if (!pathname) return;
	
	const uri = createUri(pathname);
	
	if (await fse.exists(uri)) {
		vscode.commands.executeCommand('revealFileInOS', uri);
	} else vscode.window.showErrorMessage(`Path "${pathname}" doesn't exist!`);
	
}

//	Functions __________________________________________________________________

