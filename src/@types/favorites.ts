//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { Project } from './workspaces';

import { FavoriteGroupTreeItem } from '../sidebar/trees/groups/FavoriteGroupTreeItem';
import { CurrentFavoriteTreeItem } from '../sidebar/trees/items/CurrentFavoriteTreeItem';
import { FavoriteTreeItem } from '../sidebar/trees/items/FavoriteTreeItem';

import { FavoriteGroupsState } from '../states/FavoriteGroupsState';
import { HotkeySlotsState } from '../states/HotkeySlotsState';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export interface Favorite extends Project {};

export type FavoriteGroup = {
	label:string,
	id:number,
	collapsed:boolean,
	paths:string[],
};

export interface GroupTreeItem extends vscode.TreeItem {
	saveGroupState:(workspaceGroupsState:FavoriteGroupsState, collapsed:boolean) => void;
}

export type FavoritesStates = {
	favorites:Favorite[],
	favoriteGroups:FavoriteGroup[],
	hotkeySlots:HotkeySlotsState,
};

export type FavoritesTreeItems = FavoriteTreeItems|FavoriteGroupTreeItem;

export type FavoriteTreeItems = CurrentFavoriteTreeItem|FavoriteTreeItem;

export type RefreshFavoritesStates = {
	favorites?:Favorite[],
	favoriteGroups?:FavoriteGroup[],
};

//	Functions __________________________________________________________________

