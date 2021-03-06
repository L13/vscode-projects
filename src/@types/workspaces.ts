//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { ColorPickerTreeItem } from '../sidebar/trees/ColorPickerTreeItem';
import { CurrentProjectTreeItem } from '../sidebar/trees/CurrentProjectTreeItem';
import { GroupCustomTreeItem } from '../sidebar/trees/GroupCustomTreeItem';
import { GroupSimpleTreeItem } from '../sidebar/trees/GroupSimpleTreeItem';
import { GroupTypeTreeItem } from '../sidebar/trees/GroupTypeTreeItem';
import { ProjectTreeItem } from '../sidebar/trees/ProjectTreeItem';
import { UnknownProjectTreeItem } from '../sidebar/trees/UnknownProjectTreeItem';

import { HotkeySlotsState } from '../states/HotkeySlotsState';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export type UpdateCacheCallback = (context:vscode.ExtensionContext, cache:Project[]) => void;

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

export type StatusBarColors = {
	'statusBar.background':string,
	'statusBar.foreground':string,
	'statusBarItem.hoverBackground':string,
};

export type Project = {
	path:string,
	label:string,
	type:'folder'|'folders'|WorkspaceTypes,
	color?:number,
	deleted?:boolean,
};

export type WorkspaceGroup = {
	label:string,
	id:number,
	collapsed:boolean,
	paths:string[],
	type:'custom',
};

export type WorkspaceQuickPickItem = {
	label:string,
	description:string,
	detail?:string
	paths:string[],
};

export type WorkspacesTreeItems = ColorPickerTreeItem|GroupTreeItem|WorkspaceTreeItems;

export type WorkspaceTreeItems = CurrentProjectTreeItem|ProjectTreeItem|UnknownProjectTreeItem;

export type WorkspaceTypes = 'git'|'subfolder'|'vscode'|'workspace';

export type WorkspacesStates = {
	hotkeySlots:HotkeySlotsState,
	simpleGroups:GroupSimpleState[],
	typeGroups:GroupTypeState[],
	workspaces:Project[],
	workspaceGroups:WorkspaceGroup[],
};

export type RefreshWorkspacesStates = {
	workspaces?:Project[],
	workspaceGroups?:WorkspaceGroup[],
};

//	Functions __________________________________________________________________

