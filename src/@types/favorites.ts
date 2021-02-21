//	Imports ____________________________________________________________________

import { Project } from './workspaces';

import { FavoriteGroupTreeItem } from '../sidebar/trees/FavoriteGroupTreeItem';
import { ProjectTreeItem } from '../sidebar/trees/ProjectTreeItem';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export interface Favorite extends Project {
	groupId:number,
};

export type FavoriteTreeItems = ProjectTreeItem|FavoriteGroupTreeItem;

export type FavoriteGroup = {
	label:string;
	id:number;
	collapsed:boolean;
};



//	Functions __________________________________________________________________

