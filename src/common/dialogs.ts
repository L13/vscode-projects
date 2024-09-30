//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { isMacOs } from '../@l13/platforms';

import { isRemoteWorkspace } from './workspaces';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export async function openWorkspaceFolder () {
	
	return await vscode.window.showOpenDialog(isMacOs && !isRemoteWorkspace() ? {
		canSelectFiles: true,
		canSelectFolders: true,
		canSelectMany: true,
		filters: {
			Workspaces: ['code-workspace'],
		},
	} : {
		canSelectFiles: false,
		canSelectFolders: true,
		canSelectMany: true,
	}) || null;
	
}

export async function openWorkspaceFile () {
	
	if (isRemoteWorkspace()) {
		vscode.window.showInformationMessage('Remote workspace files are not supported by Visual Studio Code');
		return null;
	}
	
	return await vscode.window.showOpenDialog({
		canSelectFiles: true,
		canSelectFolders: false,
		canSelectMany: true,
		filters: {
			Workspaces: ['code-workspace'],
		},
	}) || null;
	
}
	
export async function confirm (text: string, ...buttons: string[]) {
	
	return await vscode.window.showInformationMessage(text, { modal: true }, ...buttons);
	
}

//	Functions __________________________________________________________________

