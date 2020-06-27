//	Imports ____________________________________________________________________

import { Project } from './projects';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export type GroupSimple = {
	label:string,
	type:'project'|'git'|'vscode',
	projectTypes:(Project['type'])[]
	collapsed:boolean,
};

export type GroupSimpleState = {
	type:'project'|'git'|'vscode',
	collapsed:boolean,
};

export type GroupType = {
	label:string,
	type:'folder'|'folders'|'git'|'vscode'|'workspace',
	collapsed:boolean,
};

export type GroupTypeState = {
	type:'folder'|'folders'|'git'|'vscode'|'workspace',
	collapsed:boolean,
};

export type InitialState = 'Collapsed'|'Expanded'|'Remember';

export type WorkspaceSortting = 'Name'|'Simple'|'Type';

//	Functions __________________________________________________________________

