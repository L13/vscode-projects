//	Imports ____________________________________________________________________

import { Project } from './workspaces';

import { CurrentFavoriteTreeItem } from '../sidebar/trees/CurrentFavoriteTreeItem';
import { FavoriteGroupTreeItem } from '../sidebar/trees/FavoriteGroupTreeItem';
import { FavoriteTreeItem } from '../sidebar/trees/FavoriteTreeItem';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export interface Favorite extends Project {};

export type FavoritesTreeItems = FavoriteTreeItems|FavoriteGroupTreeItem;

export type FavoriteTreeItems = CurrentFavoriteTreeItem|FavoriteTreeItem;

export type FavoriteGroup = {
	label:string,
	id:number,
	collapsed:boolean,
	paths:string[],
};

//	Functions __________________________________________________________________

