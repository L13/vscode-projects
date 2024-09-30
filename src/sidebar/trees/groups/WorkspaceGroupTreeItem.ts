//	Imports ____________________________________________________________________

import { join } from 'path';
import { TreeItem, TreeItemCollapsibleState } from 'vscode';

import type { GroupTreeItem, WorkspaceGroup } from '../../../@types/workspaces';

import type { WorkspaceGroupsState } from '../../../states/WorkspaceGroupsState';

//	Variables __________________________________________________________________

const basePath = join(__dirname, '..', 'images', 'groups');
const iconPath = {
	light: join(basePath, 'group-custom-light.svg'),
	dark: join(basePath, 'group-custom-dark.svg'),
};

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class WorkspaceGroupTreeItem extends TreeItem implements GroupTreeItem {
	
	public contextValue = 'workspaceGroup';
	
	public iconPath = iconPath;
	
	public constructor (public readonly group: WorkspaceGroup, public description: string) {
		
		super(group.label, group.collapsed ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.Expanded);
		
		this.id = `workspace-group-${group.id}`;
		
	}
	
	public saveGroupState (workspaceGroupsState: WorkspaceGroupsState, collapsed: boolean) {
		
		workspaceGroupsState.saveWorkspaceGroupState(this, collapsed);
		
	}
	
}

//	Functions __________________________________________________________________

