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
		
		const name = `project-${group.type}`;
		
		this.contextValue = `group-${name}`;
		this.id = `group-${name}`;
		
		this.iconPath = {
			light: join(__filename, '..', '..', 'images', 'types', `${name}-light.svg`),
			dark: join(__filename, '..', '..', 'images', 'types', `${name}-dark.svg`),
		};
		
	}
	
}

//	Functions __________________________________________________________________

