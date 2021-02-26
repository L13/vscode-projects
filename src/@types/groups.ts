//	Imports ____________________________________________________________________

import { Project } from './workspaces';

import { GroupCustomTreeItem } from '../sidebar/trees/GroupCustomTreeItem';
import { GroupSimpleTreeItem } from '../sidebar/trees/GroupSimpleTreeItem';
import { GroupTypeTreeItem } from '../sidebar/trees/GroupTypeTreeItem';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export type GroupTreeItem = GroupCustomTreeItem|GroupSimpleTreeItem|GroupTypeTreeItem;

export type GroupCustom = {
	label:string,
	collapsed:boolean,
};

export type GroupCustomState = {
	type:'custom',
	collapsed:boolean,
};

export type GroupSimple = {
	label:string,
	type:'project'|'git'|'vscode'|'subfolder',
	projectTypes:(Project['type'])[]
	collapsed:boolean,
};

export type GroupSimpleState = {
	type:'project'|'git'|'vscode'|'subfolder',
	collapsed:boolean,
};

export type GroupType = {
	label:string,
	type:'folder'|'folders'|'git'|'vscode'|'workspace'|'subfolder',
	collapsed:boolean,
};

export type GroupTypeState = {
	type:'folder'|'folders'|'git'|'vscode'|'workspace'|'subfolder',
	collapsed:boolean,
};

export type InitialState = 'Collapsed'|'Expanded'|'Remember';

export type WorkspaceSorting = 'Group'|'Name'|'Simple'|'Type';

//	Functions __________________________________________________________________

