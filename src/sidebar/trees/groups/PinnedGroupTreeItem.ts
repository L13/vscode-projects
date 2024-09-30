//	Imports ____________________________________________________________________

import { ThemeIcon, TreeItem, TreeItemCollapsibleState } from 'vscode';

import type { GroupTreeItem, PinnedGroup } from '../../../@types/workspaces';

import type { WorkspaceGroupsState } from '../../../states/WorkspaceGroupsState';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class PinnedGroupTreeItem extends TreeItem implements GroupTreeItem {
	
	public constructor (public readonly group: PinnedGroup, public description: string) {
		
		super(group.label, group.collapsed ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.Expanded);
		
		this.iconPath = new ThemeIcon('pinned');
		
	}
	
	public saveGroupState (workspaceGroupsState: WorkspaceGroupsState, collapsed: boolean) {
		
		workspaceGroupsState.savePinnedGroupState(this, collapsed);
		
	}
	
}

//	Functions __________________________________________________________________

