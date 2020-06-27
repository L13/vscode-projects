//	Imports ____________________________________________________________________

import { join } from 'path';
import { TreeItem, TreeItemCollapsibleState } from 'vscode';

import { GroupSimple } from '../@types/groups';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class GroupSimpleTreeItem extends TreeItem {
	
	// triggers the tree view to recreate all items for collapse all
	private static stateVersion:number = 0;
	
	public static toggleStateVersion () {
		
		GroupSimpleTreeItem.stateVersion = 1 - GroupSimpleTreeItem.stateVersion;
		
	}
	
	public constructor (public readonly group:GroupSimple) {
		
		super(group.label, group.collapsed ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.Expanded);
		
		const type = group.type;
		
		this.contextValue = `group-simple-${type}`;
		this.id = `group-simple-${type}-${GroupSimpleTreeItem.stateVersion}`;
		
		this.iconPath = {
			light: join(__filename, '..', '..', 'images', `group-simple-${type}-light.svg`),
			dark: join(__filename, '..', '..', 'images', `group-simple-${type}-dark.svg`),
		};
		
	}
	
}

//	Functions __________________________________________________________________

