//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { ColorPickerTreeItem } from '../sidebar/trees/items/ColorPickerTreeItem';
import { CurrentWorkspaceTreeItem } from '../sidebar/trees/items/CurrentWorkspaceTreeItem';
import { ProjectTreeItem } from '../sidebar/trees/items/ProjectTreeItem';
import { UnknownProjectTreeItem } from '../sidebar/trees/items/UnknownProjectTreeItem';

import { SimpleGroupTreeItem } from '../sidebar/trees/groups/SimpleGroupTreeItem';
import { TypeGroupTreeItem } from '../sidebar/trees/groups/TypeGroupTreeItem';
import { WorkspaceGroupTreeItem } from '../sidebar/trees/groups/WorkspaceGroupTreeItem';

import { HotkeySlotsState } from '../states/HotkeySlotsState';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export type UpdateCacheCallback = (context:vscode.ExtensionContext, cache:Project[]) => void;

export type GroupTreeItem = WorkspaceGroupTreeItem|SimpleGroupTreeItem|TypeGroupTreeItem;

export type SimpleGroup = {
	label:string,
	type:'project'|'git'|'vscode'|'subfolder',
	projectTypes:(Project['type'])[]
	collapsed:boolean,
};

export type SimpleGroupState = {
	type:'project'|'git'|'vscode'|'subfolder',
	collapsed:boolean,
};

export type TypeGroup = {
	label:string,
	type:'folder'|'folders'|'git'|'vscode'|'workspace'|'subfolder',
	collapsed:boolean,
};

export type TypeGroupState = {
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

export type WorkspaceTreeItems = CurrentWorkspaceTreeItem|ProjectTreeItem|UnknownProjectTreeItem;

export type WorkspaceTypes = 'git'|'subfolder'|'vscode'|'workspace';

export type WorkspacesStates = {
	hotkeySlots:HotkeySlotsState,
	simpleGroups:SimpleGroupState[],
	typeGroups:TypeGroupState[],
	workspaces:Project[],
	workspaceGroups:WorkspaceGroup[],
};

export type RefreshWorkspacesStates = {
	task?:() => Promise<Project[]>,
	workspaces?:Project[],
	workspaceGroups?:WorkspaceGroup[],
};

//	Functions __________________________________________________________________

