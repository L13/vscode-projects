//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { ColorPickerTreeItem } from '../sidebar/trees/items/ColorPickerTreeItem';
import { CurrentWorkspaceTreeItem } from '../sidebar/trees/items/CurrentWorkspaceTreeItem';
import { TagTreeItem } from '../sidebar/trees/items/TagTreeItem';
import { UnknownProjectTreeItem } from '../sidebar/trees/items/UnknownProjectTreeItem';
import { WorkspaceTreeItem } from '../sidebar/trees/items/WorkspaceTreeItem';

import { PinnedGroupTreeItem } from '../sidebar/trees/groups/PinnedGroupTreeItem';
import { RootGroupTreeItem } from '../sidebar/trees/groups/RootGroupTreeItem';
import { SimpleGroupTreeItem } from '../sidebar/trees/groups/SimpleGroupTreeItem';
import { TagGroupTreeItem } from '../sidebar/trees/groups/TagGroupTreeItem';
import { TypeGroupTreeItem } from '../sidebar/trees/groups/TypeGroupTreeItem';
import { WorkspaceGroupTreeItem } from '../sidebar/trees/groups/WorkspaceGroupTreeItem';

import { HotkeySlotsState } from '../states/HotkeySlotsState';
import { WorkspaceGroupsState } from '../states/WorkspaceGroupsState';

import { Tag } from './tags';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export type UpdateCacheCallback = (context: vscode.ExtensionContext, cache: Project[]) => void;

export type GroupTreeItems = WorkspaceGroupTreeItem|TagGroupTreeItem|PinnedGroupTreeItem|RootGroupTreeItem|SimpleGroupTreeItem|TypeGroupTreeItem;

export interface GroupTreeItem extends vscode.TreeItem {
	saveGroupState: (workspaceGroupsState: WorkspaceGroupsState, collapsed: boolean) => void;
}

export type ContextTypes = 'folder'|'folders'|'git'|'subfolder'|'vscode'|'workspace'|'remote'|'virtual';

export type SimpleGroupTypes = 'azure'
|'container'
|'docker'
|'git'
|'github'
|'kubernetes'
|'project'
|'ssh'
|'subfolder'
|'vscode'
|'wsl';

export type SimpleGroup = {
	label: string,
	type: SimpleGroupTypes,
	projectTypes: ProjectTypes[],
	collapsed: boolean,
};

export type SimpleGroupState = {
	type: SimpleGroupTypes,
	collapsed: boolean,
};

export type TypeGroup = {
	remote: boolean,
	label: string,
	type: ProjectTypes,
	collapsed: boolean,
};

export type TypeGroupState = {
	type: ProjectTypes,
	collapsed: boolean,
};

export type PinnedGroup = {
	label: string,
	projectTypes: ProjectTypes[],
	collapsed: boolean,
};

export type PinnedGroupState = {
	collapsed: boolean,
};

export type RootGroup = {
	label: string,
	root: string,
	collapsed: boolean,
};

export type RootGroupState = {
	root: string,
	collapsed: boolean,
};

export type StatusBarColors = {
	'statusBar.background': string,
	'statusBar.foreground': string,
	'statusBarItem.hoverBackground': string,
};

export type ProjectTypes = 'folder'|'folders'|WorkspaceTypes|RemoteTypes|VirtualTypes;

export type Project = {
	root: string,
	path: string,
	label: string,
	type: ProjectTypes,
	remote: boolean,
	color?: number,
	deleted?: boolean,
};

export type WorkspaceGroup = {
	label: string,
	id: number,
	collapsed: boolean,
	paths: string[],
};

export type WorkspaceQuickPickItem = {
	label: string,
	description: string,
	detail?: string
	paths: string[],
};

export type RemoteTypes = 'codespace'|'container'|'docker'|'kubernetes'|'remote'|'ssh'|'wsl';

export type ViewContext = 'favorite'|'project';

export type VirtualTypes = 'azure'|'github'|'virtual';

export type WorkspacesTreeItems = ColorPickerTreeItem|GroupTreeItems|WorkspaceTreeItems;

export type WorkspaceTreeItems = CurrentWorkspaceTreeItem|WorkspaceTreeItem|TagTreeItem|UnknownProjectTreeItem;

export type WorkspaceTypes = 'git'|'subfolder'|'vscode'|'workspace';

export type WorkspacesStates = {
	hotkeySlots: HotkeySlotsState,
	tags: Tag[],
	workspaces: Project[],
	workspaceGroups: WorkspaceGroup[],
};

export type RefreshWorkspacesStates = {
	tags?: Tag[],
	workspaces?: Project[],
	workspaceGroups?: WorkspaceGroup[],
};

//	Functions __________________________________________________________________

