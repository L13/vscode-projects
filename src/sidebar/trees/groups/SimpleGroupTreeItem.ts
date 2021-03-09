//	Imports ____________________________________________________________________

import { join } from 'path';
import { TreeItem, TreeItemCollapsibleState } from 'vscode';

import { SimpleGroup } from '../../../@types/workspaces';

//	Variables __________________________________________________________________

const basePath = join(__dirname, '..', 'images', 'groups');

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class SimpleGroupTreeItem extends TreeItem {
	
	public constructor (public readonly group:SimpleGroup) {
		
		super(group.label, group.collapsed ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.Expanded);
		
		const name = `group-simple-${group.type}`;
		
		this.contextValue = name;
		this.id = name;
		
		this.iconPath = {
			light: join(basePath, `${name}-light.svg`),
			dark: join(basePath, `${name}-dark.svg`),
		};
		
	}
	
}

//	Functions __________________________________________________________________

