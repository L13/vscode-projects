//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { Tag, TagGroupState } from './tags';

import { ColorPickerTreeItem } from '../sidebar/trees/items/ColorPickerTreeItem';
import { CurrentWorkspaceTreeItem } from '../sidebar/trees/items/CurrentWorkspaceTreeItem';
import { ProjectTreeItem } from '../sidebar/trees/items/ProjectTreeItem';
import { TagTreeItem } from '../sidebar/trees/items/TagTreeItem';
import { UnknownProjectTreeItem } from '../sidebar/trees/items/UnknownProjectTreeItem';

import { SimpleGroupTreeItem } from '../sidebar/trees/groups/SimpleGroupTreeItem';
import { TagGroupTreeItem } from '../sidebar/trees/groups/TagGroupTreeItem';
import { TypeGroupTreeItem } from '../sidebar/trees/groups/TypeGroupTreeItem';
import { WorkspaceGroupTreeItem } from '../sidebar/trees/groups/WorkspaceGroupTreeItem';

import { HotkeySlotsState } from '../states/HotkeySlotsState';
import { WorkspaceGroupsState } from '../states/WorkspaceGroupsState';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export type UpdateCacheCallback = (context:vscode.ExtensionContext, cache:Project[]) => void;

export type GroupTreeItems = WorkspaceGroupTreeItem|TagGroupTreeItem|SimpleGroupTreeItem|TypeGroupTreeItem;

export interface GroupTreeItem extends vscode.TreeItem {
	saveGroupState:(workspaceGroupsState:WorkspaceGroupsState, collapsed:boolean) => void;
}

export type SimpleGroupTypes = 'project'|'git'|'vscode'|'subfolder';

export type SimpleGroup = {
	label:string,
	type:SimpleGroupTypes,
	projectTypes:(Project['type'])[],
	collapsed:boolean,
};

export type SimpleGroupState = {
	type:SimpleGroupTypes,
	collapsed:boolean,
};

export type TypeGroup = {
	label:string,
	type:Project['type'],
	collapsed:boolean,
};

export type TypeGroupState = {
	type:Project['type'],
	collapsed:boolean,
};

export type StatusBarColors = {
	'statusBar.background':string,
	'statusBar.foreground':string,
	'statusBarItem.hoverBackground':string,
};

export type ProjectTypes = 'folder'|'folders'|WorkspaceTypes;

export type Project = {
	path:string,
	label:string,
	type:ProjectTypes,
	color?:number,
	deleted?:boolean,
};

export type WorkspaceGroup = {
	label:string,
	id:number,
	collapsed:boolean,
	paths:string[],
};

export type WorkspaceQuickPickItem = {
	label:string,
	description:string,
	detail?:string
	paths:string[],
};

export type WorkspacesTreeItems = ColorPickerTreeItem|GroupTreeItems|WorkspaceTreeItems;

export type WorkspaceTreeItems = CurrentWorkspaceTreeItem|ProjectTreeItem|TagTreeItem|UnknownProjectTreeItem;

export type WorkspaceTypes = 'git'|'subfolder'|'vscode'|'workspace';

export type WorkspacesStates = {
	hotkeySlots:HotkeySlotsState,
	simpleGroups:SimpleGroupState[],
	tags:Tag[],
	tagGroup:TagGroupState,
	typeGroups:TypeGroupState[],
	workspaces:Project[],
	workspaceGroups:WorkspaceGroup[],
};

export type RefreshWorkspacesStates = {
	tags?:Tag[],
	workspaces?:Project[],
	workspaceGroups?:WorkspaceGroup[],
};

//	Functions __________________________________________________________________

