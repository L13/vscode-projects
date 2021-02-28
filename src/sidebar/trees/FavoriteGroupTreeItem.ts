//	Imports ____________________________________________________________________

import { join } from 'path';
import * as vscode from 'vscode';

import { FavoriteGroup } from '../../@types/favorites';

//	Variables __________________________________________________________________

const basePath = join(__dirname, '..', 'images', 'favorites');
const iconPath = {
	light: join(basePath, `group-favorites-light.svg`),
	dark: join(basePath, `group-favorites-dark.svg`),
};

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class FavoriteGroupTreeItem extends vscode.TreeItem {
	
	public contextValue = 'favoriteGroup';
		
	public iconPath = iconPath;
	
	public constructor (public readonly favoriteGroup:FavoriteGroup) {
		
		super(favoriteGroup.label, favoriteGroup.collapsed ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.Expanded);
		
		this.id = `favorite-group-${favoriteGroup.id}`;
		
	}
	
}

//	Functions __________________________________________________________________

