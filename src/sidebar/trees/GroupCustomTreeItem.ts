//	Imports ____________________________________________________________________

import { join } from 'path';
import { TreeItem, TreeItemCollapsibleState } from 'vscode';

import { WorkspaceGroup } from '../../@types/workspaces';

//	Variables __________________________________________________________________

const basePath = join(__dirname, '..', 'images', 'groups');

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class GroupCustomTreeItem extends TreeItem {
	
	public contextValue = 'workspaceGroup';
	
	public constructor (public readonly group:WorkspaceGroup) {
		
		super(group.label, group.collapsed ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.Expanded);
		
		const name = `group-custom`;
		
		this.id = `workspace-group-${group.id}`;
		
		this.iconPath = {
			light: join(basePath, `${name}-light.svg`),
			dark: join(basePath, `${name}-dark.svg`),
		};
		
	}
	
}

//	Functions __________________________________________________________________

