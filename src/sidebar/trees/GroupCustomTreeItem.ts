//	Imports ____________________________________________________________________

import { join } from 'path';
import { TreeItem, TreeItemCollapsibleState } from 'vscode';

import { WorkspaceGroup } from '../../@types/workspaces';

//	Variables __________________________________________________________________

const basePath = join(__dirname, '..', 'images', 'workspaces');
const iconPath = {
	light: join(basePath, `group-custom-light.svg`),
	dark: join(basePath, `group-custom-dark.svg`),
};

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class GroupCustomTreeItem extends TreeItem {
	
	public contextValue = 'workspaceGroup';
	
	public iconPath = iconPath;
	
	public constructor (public readonly group:WorkspaceGroup) {
		
		super(group.label, group.collapsed ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.Expanded);
		
		this.id = `workspace-group-${group.id}`;
		
	}
	
}

//	Functions __________________________________________________________________

