//	Imports ____________________________________________________________________

import { join } from 'path';
import { TreeItem, TreeItemCollapsibleState } from 'vscode';

import { GroupType } from '../@types/groups';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class GroupTypeTreeItem extends TreeItem {
	
	public constructor (public readonly group:GroupType) {
		
		super(group.label, group.collapsed ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.Expanded);
		
		const type = group.type;
		
		this.contextValue = `group-type-${type}`;
		
		this.iconPath = {
			light: join(__filename, '..', '..', 'images', `group-type-${type}-light.svg`),
			dark: join(__filename, '..', '..', 'images', `group-type-${type}-dark.svg`),
		};
		
	}
	
}

//	Functions __________________________________________________________________

