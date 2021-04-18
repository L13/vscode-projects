//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { ColorPickerTreeItem } from '../sidebar/trees/items/ColorPickerTreeItem';
import { TagTreeItem } from '../sidebar/trees/items/TagTreeItem';

import { HotkeySlotsState } from '../states/HotkeySlotsState';
import { WorkspaceGroupsState } from '../states/WorkspaceGroupsState';

import { Project } from './workspaces';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export interface GroupTreeItem extends vscode.TreeItem {
	saveGroupState:(workspaceGroupsState:WorkspaceGroupsState, collapsed:boolean) => void;
}

export type Tag = {
	label:string,
	id:number,
	paths:string[],
};

export type TagGroup = {
	label:string,
	collapsed:boolean,
};

export type TagGroupState = {
	collapsed:boolean,
};

export type TagsTreeItems = ColorPickerTreeItem|TagTreeItem;

export interface TagQuickPickItem extends vscode.QuickPickItem {
	workspace?:Project,
}

export type TagsStates = {
	hotkeySlots:HotkeySlotsState,
	tags:Tag[],
};

export type RefreshTagsStates = {
	tags?:Tag[],
};

//	Functions __________________________________________________________________

