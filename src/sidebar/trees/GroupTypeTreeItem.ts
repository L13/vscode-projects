//	Imports ____________________________________________________________________

import { join } from 'path';
import { TreeItem, TreeItemCollapsibleState } from 'vscode';

import { GroupType } from '../../@types/groups';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class GroupTypeTreeItem extends TreeItem {
	
	public constructor (public readonly group:GroupType) {
		
		super(group.label, group.collapsed ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.Expanded);
		
		const name = `group-type-${group.type}`;
		
		this.contextValue = name;
		this.id = name;
		
		this.iconPath = {
			light: join(__filename, '..', '..', 'images', `${name}-light.svg`),
			dark: join(__filename, '..', '..', 'images', `${name}-dark.svg`),
		};
		
	}
	
}

//	Functions __________________________________________________________________

