//	Imports ____________________________________________________________________

import { join } from 'path';
import { TreeItem, TreeItemCollapsibleState } from 'vscode';

import { GroupSimple } from '../../@types/groups';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class GroupSimpleTreeItem extends TreeItem {
	
	public constructor (public readonly group:GroupSimple) {
		
		super(group.label, group.collapsed ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.Expanded);
		
		const name = `group-simple-${group.type}`;
		
		this.contextValue = name;
		this.id = name;
		
		this.iconPath = {
			light: join(__filename, '..', '..', 'images', 'groups', `${name}-light.svg`),
			dark: join(__filename, '..', '..', 'images', 'groups', `${name}-dark.svg`),
		};
		
	}
	
}

//	Functions __________________________________________________________________

