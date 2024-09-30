//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import type { Project, ProjectTypes, WorkspaceTypes } from '../@types/workspaces';

import { formatLabel } from '../@l13/formats';

import { getPath, getUri } from './uris';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export const findExtWorkspace = /\.code-workspace$/;

export function isCodeWorkspace (workspacePath: string) {
		
	return findExtWorkspace.test(workspacePath);
	
}

export function getCurrentWorkspaceUri () {
	
	const workspace = vscode.workspace;
	let uri = workspace.workspaceFile;
	
	if (!uri && workspace.workspaceFolders) uri = workspace.workspaceFolders[0].uri;
	
	return uri || null;
	
}

export function isRemoteWorkspace (uri?: vscode.Uri) {
	
	uri = uri || getCurrentWorkspaceUri();
	
	return !!uri && uri.scheme !== 'untitled' && uri.scheme !== 'file';
	
}

export function getCurrentWorkspacePath () {
	
	const uri = getCurrentWorkspaceUri();
	
	return uri && uri.scheme !== 'untitled' ? getPath(uri) : '';
	
}

export function createWorkspaceItem (pathOrUri: string|vscode.Uri, type?: WorkspaceTypes, label?: string, root?: string): Project {
	
	const uri = getUri(pathOrUri);
	const fsPath = uri.path;
	
	return {
		label: label || formatLabel(fsPath),
		root,
		path: getPath(uri),
		remote: uri.scheme !== 'file',
		type: type || detectWorkspaceType(uri),
	};
	
}

//	Functions __________________________________________________________________

function detectWorkspaceType (uri: vscode.Uri): ProjectTypes {
	
	if (uri.scheme !== 'file') {
		const authority = uri.authority;
		switch (uri.scheme) {
			case 'vscode-remote':
				if (authority.startsWith('codespaces+')) return 'codespace';
				if (authority.startsWith('exec+')) return 'container';
				if (authority.startsWith('attached-container+')
				|| authority.startsWith('dev-container+')) return 'docker';
				if (authority.startsWith('k8s-container+')) return 'kubernetes';
				if (authority.startsWith('ssh-remote+')) return 'ssh';
				if (authority.startsWith('wsl+')) return 'wsl';
				return 'remote';
			case 'azdo':
			case 'github':
			case 'vscode-vfs':
				if (authority.startsWith('azdo')) return 'azure';
				if (authority.startsWith('github')) return 'github';
				return 'virtual';
		}
		return 'remote';
	}
	
	return isCodeWorkspace(uri.fsPath) ? 'folders' : 'folder';
	
}