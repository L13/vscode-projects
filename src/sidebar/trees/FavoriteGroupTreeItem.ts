//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { FavoriteGroup } from '../../@types/favorites';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class FavoriteGroupTreeItem extends vscode.TreeItem {
	
	public contextValue = 'favoriteGroup';
	
	public constructor (public readonly favoriteGroup:FavoriteGroup) {
		
		super(favoriteGroup.label, favoriteGroup.collapsed ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.Expanded);
		
		this.id = `favorite-group-${favoriteGroup.id}`;
		
	}
	
}

//	Functions __________________________________________________________________

