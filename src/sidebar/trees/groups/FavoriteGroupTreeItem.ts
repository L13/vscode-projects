//	Imports ____________________________________________________________________

import { join } from 'path';
import { TreeItem, TreeItemCollapsibleState } from 'vscode';

import { FavoriteGroup, GroupTreeItem } from '../../../@types/favorites';

import { FavoriteGroupsState } from '../../../states/FavoriteGroupsState';

//	Variables __________________________________________________________________

const basePath = join(__dirname, '..', 'images', 'groups');
const iconPath = {
	light: join(basePath, 'group-custom-light.svg'),
	dark: join(basePath, 'group-custom-dark.svg'),
};

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class FavoriteGroupTreeItem extends TreeItem implements GroupTreeItem {
	
	public contextValue = 'favoriteGroup';
		
	public iconPath = iconPath;
	
	public constructor (public readonly group:FavoriteGroup, public description:string) {
		
		super(group.label, group.collapsed ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.Expanded);
		
		this.id = `favorite-group-${group.id}`;
		
	}
	
	public saveGroupState (favoriteGroupsState:FavoriteGroupsState, collapsed:boolean) {
		
		favoriteGroupsState.saveCollapsedState(this, collapsed);
		
	}
	
}

//	Functions __________________________________________________________________

