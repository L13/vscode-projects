//	Imports ____________________________________________________________________

import { join } from 'path';
import { TreeItem, TreeItemCollapsibleState } from 'vscode';

import type { GroupTreeItem, SimpleGroup } from '../../../@types/workspaces';

import type { WorkspaceGroupsState } from '../../../states/WorkspaceGroupsState';

//	Variables __________________________________________________________________

const basePath = join(__dirname, '..', 'images', 'groups');

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class SimpleGroupTreeItem extends TreeItem implements GroupTreeItem {
	
	public constructor (public readonly group: SimpleGroup, public description: string) {
		
		super(group.label, group.collapsed ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.Expanded);
		
		const name = `group-simple-${group.type}`;
		
		this.contextValue = name;
		this.id = name;
		
		this.iconPath = {
			light: join(basePath, `${name}-light.svg`),
			dark: join(basePath, `${name}-dark.svg`),
		};
		
	}
	
	public saveGroupState (workspaceGroupsState: WorkspaceGroupsState, collapsed: boolean) {
		
		workspaceGroupsState.saveSimpleGroupState(this, collapsed);
		
	}
	
}

//	Functions __________________________________________________________________

