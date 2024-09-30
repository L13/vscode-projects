//	Imports ____________________________________________________________________

import { join } from 'path';
import { TreeItem, TreeItemCollapsibleState } from 'vscode';

import type { GroupTreeItem, RootGroup } from '../../../@types/workspaces';

import type { WorkspaceGroupsState } from '../../../states/WorkspaceGroupsState';

//	Variables __________________________________________________________________

const basePath = join(__dirname, '..', 'images', 'groups');
const iconPath = {
	light: join(basePath, 'group-root-light.svg'),
	dark: join(basePath, 'group-root-dark.svg'),
};

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class RootGroupTreeItem extends TreeItem implements GroupTreeItem {
	
	public iconPath = iconPath;
	
	public constructor (public readonly group: RootGroup, public description: string) {
		
		super(group.label, group.collapsed ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.Expanded);
		
		const root = group.root;
		
		this.contextValue = 'group-project-root';
		this.id = root;
		this.tooltip = root;
		
	}
	
	public saveGroupState (workspaceGroupsState: WorkspaceGroupsState, collapsed: boolean) {
		
		workspaceGroupsState.saveRootGroupState(this, collapsed);
		
	}
	
}

//	Functions __________________________________________________________________

