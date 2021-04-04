//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { FavoriteGroupTreeItem } from '../sidebar/trees/groups/FavoriteGroupTreeItem';
import { CurrentFavoriteTreeItem } from '../sidebar/trees/items/CurrentFavoriteTreeItem';
import { FavoriteTreeItem } from '../sidebar/trees/items/FavoriteTreeItem';

import { FavoriteGroupsState } from '../states/FavoriteGroupsState';
import { HotkeySlotsState } from '../states/HotkeySlotsState';
import { Project } from './workspaces';

import { Tag } from './tags';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Favorite extends Project {}

export type FavoriteGroup = {
	label:string,
	id:number,
	collapsed:boolean,
	paths:string[],
};

export type FavoriteQuickPickItem = {
	label:string,
	description?:string,
	detail?:string,
	favorite?:Favorite,
	favoriteGroup?:FavoriteGroup,
};

export type FavoritesStates = {
	favorites:Favorite[],
	favoriteGroups:FavoriteGroup[],
	hotkeySlots:HotkeySlotsState,
	tags:Tag[],
};

export type FavoritesTreeItems = FavoriteTreeItems|FavoriteGroupTreeItem;

export type FavoriteTreeItems = CurrentFavoriteTreeItem|FavoriteTreeItem;

export interface GroupTreeItem extends vscode.TreeItem {
	saveGroupState:(workspaceGroupsState:FavoriteGroupsState, collapsed:boolean) => void;
}

export type RefreshFavoritesStates = {
	favorites?:Favorite[],
	favoriteGroups?:FavoriteGroup[],
	tags?:Tag[],
};

//	Functions __________________________________________________________________

