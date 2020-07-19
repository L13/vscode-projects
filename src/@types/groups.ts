//	Imports ____________________________________________________________________

import { Project } from './workspaces';

import { GroupSimpleTreeItem } from '../sidebar/trees/GroupSimpleTreeItem';
import { GroupTypeTreeItem } from '../sidebar/trees/GroupTypeTreeItem';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export type GroupTreeItem = GroupSimpleTreeItem|GroupTypeTreeItem;

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

