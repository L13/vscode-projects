//	Imports ____________________________________________________________________

import { join } from 'path';
import { TreeItem, TreeItemCollapsibleState } from 'vscode';

import { GroupTreeItem, TypeGroup } from '../../../@types/workspaces';

import { WorkspaceGroupsState } from '../../../states/WorkspaceGroupsState';

//	Variables __________________________________________________________________

const basePath = join(__dirname, '..', 'images', 'types');

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class TypeGroupTreeItem extends TreeItem implements GroupTreeItem {
	
	public constructor (public readonly group:TypeGroup) {
		
		super(group.label, group.collapsed ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.Expanded);
		
		const name = `project-${group.type}`;
		
		this.contextValue = `group-${name}`;
		this.id = `group-${name}`;
		
		this.iconPath = {
			light: join(basePath, `${name}-light.svg`),
			dark: join(basePath, `${name}-dark.svg`),
		};
		
	}
	
	public saveGroupState (workspaceGroupsState:WorkspaceGroupsState, collapsed:boolean) {
		
		workspaceGroupsState.saveTypeGroupState(this, collapsed);
		
	}
	
}

//	Functions __________________________________________________________________

