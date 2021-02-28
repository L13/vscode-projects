//	Imports ____________________________________________________________________

import { join } from 'path';
import { TreeItem, TreeItemCollapsibleState } from 'vscode';

import { FavoriteGroup } from '../../@types/favorites';

//	Variables __________________________________________________________________

const basePath = join(__dirname, '..', 'images', 'groups');
const iconPath = {
	light: join(basePath, `group-custom-light.svg`),
	dark: join(basePath, `group-custom-dark.svg`),
};

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class FavoriteGroupTreeItem extends TreeItem {
	
	public contextValue = 'favoriteGroup';
		
	public iconPath = iconPath;
	
	public constructor (public readonly favoriteGroup:FavoriteGroup) {
		
		super(favoriteGroup.label, favoriteGroup.collapsed ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.Expanded);
		
		this.id = `favorite-group-${favoriteGroup.id}`;
		
	}
	
}

//	Functions __________________________________________________________________

