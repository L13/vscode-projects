//	Imports ____________________________________________________________________

import { join } from 'path';
import * as vscode from 'vscode';

import { FavoriteGroup } from '../../@types/favorites';

//	Variables __________________________________________________________________

const basePath = join(__dirname, '..', 'images', 'favorites');

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class FavoriteGroupTreeItem extends vscode.TreeItem {
	
	public contextValue = 'favoriteGroup';
	
	public constructor (public readonly favoriteGroup:FavoriteGroup) {
		
		super(favoriteGroup.label, favoriteGroup.collapsed ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.Expanded);
		
		const name = `group-favorites`;
		
		this.id = `favorite-group-${favoriteGroup.id}`;
		
		this.iconPath = {
			light: join(basePath, `${name}-light.svg`),
			dark: join(basePath, `${name}-dark.svg`),
		};
		
	}
	
}

//	Functions __________________________________________________________________

