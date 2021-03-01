//	Imports ____________________________________________________________________

import { join } from 'path';
import { TreeItem, TreeItemCollapsibleState } from 'vscode';

import { GroupType } from '../../@types/workspaces';

//	Variables __________________________________________________________________

const basePath = join(__dirname, '..', 'images', 'types');

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class GroupTypeTreeItem extends TreeItem {
	
	public constructor (public readonly group:GroupType) {
		
		super(group.label, group.collapsed ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.Expanded);
		
		const name = `project-${group.type}`;
		
		this.contextValue = `group-${name}`;
		this.id = `group-${name}`;
		
		this.iconPath = {
			light: join(basePath, `${name}-light.svg`),
			dark: join(basePath, `${name}-dark.svg`),
		};
		
	}
	
}

//	Functions __________________________________________________________________

