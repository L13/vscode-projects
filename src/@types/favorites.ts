//	Imports ____________________________________________________________________

import { Project } from './workspaces';

import { CurrentFavoriteTreeItem } from '../sidebar/trees/CurrentFavoriteTreeItem';
import { FavoriteGroupTreeItem } from '../sidebar/trees/FavoriteGroupTreeItem';
import { FavoriteTreeItem } from '../sidebar/trees/FavoriteTreeItem';

import { FavoriteGroupsState } from '../states/FavoriteGroupsState';
import { FavoritesState } from '../states/FavoritesState';
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
	removed?:boolean,
};

export type FavoritesStates = {
	hotkeySlots:HotkeySlotsState,
	favorites:FavoritesState,
	favoriteGroups:FavoriteGroupsState,
};

export type FavoritesTreeItems = FavoriteTreeItems|FavoriteGroupTreeItem;

export type FavoriteTreeItems = CurrentFavoriteTreeItem|FavoriteTreeItem;

export type RefreshFavoritesStates = {
	favorites?:boolean,
	favoriteGroups?:boolean,
};

//	Functions __________________________________________________________________

