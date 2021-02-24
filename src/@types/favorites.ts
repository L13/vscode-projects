//	Imports ____________________________________________________________________

import { Project } from './workspaces';

import { CurrentFavoriteTreeItem } from '../sidebar/trees/CurrentFavoriteTreeItem';
import { FavoriteGroupTreeItem } from '../sidebar/trees/FavoriteGroupTreeItem';
import { FavoriteTreeItem } from '../sidebar/trees/FavoriteTreeItem';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export interface Favorite extends Project {
	groupId?:number,
};

export type FavoriteTreeItems = CurrentFavoriteTreeItem|FavoriteTreeItem|FavoriteGroupTreeItem;

export type FavoriteGroup = {
	label:string;
	id:number;
	collapsed:boolean;
};

//	Functions __________________________________________________________________

