//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import type { WorkspaceTypes } from './workspaces';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export type ScanFolder = {
	path: string,
	type: WorkspaceTypes,
};

export type ScanResult = {
	error: Error,
	result: WalkTreeJob['result'],
	type: WorkspaceTypes,
};

export type WalkTreeOptions = {
	find: RegExp,
	type: 'file'|'folder'|'subfolder',
	ignore?: string[],
	maxDepth?: number,
	done?: (error: Error, job?: WalkTreeJob['result']) => void,
};

export type WalkTreeJob = {
	find: RegExp,
	type: 'file'|'folder'|'subfolder',
	ignore: RegExp,
	result: {
		root: string,
		uris: vscode.Uri[],
	},
	done?: (error: Error, job?: WalkTreeJob['result']) => void,
};

//	Functions __________________________________________________________________

