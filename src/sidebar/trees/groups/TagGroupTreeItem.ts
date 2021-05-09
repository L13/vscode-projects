//	Imports ____________________________________________________________________

import { join } from 'path';
import { TreeItem, TreeItemCollapsibleState } from 'vscode';

import type { GroupTreeItem, TagGroup } from '../../../@types/tags';

import type { WorkspaceGroupsState } from '../../../states/WorkspaceGroupsState';

//	Variables __________________________________________________________________

const basePath = join(__dirname, '..', 'images', 'tags');
const iconPath = {
	light: join(basePath, 'tag-light.svg'),
	dark: join(basePath, 'tag-dark.svg'),
};

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class TagGroupTreeItem extends TreeItem implements GroupTreeItem {
	
	public contextValue = 'tagGroup';
	
	public iconPath = iconPath;
	
	public constructor (public readonly group:TagGroup) {
		
		super(group.label, group.collapsed ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.Expanded);
		
		this.id = 'tag-group';
		
	}
	
	public saveGroupState (workspaceGroupsState:WorkspaceGroupsState, collapsed:boolean) {
		
		workspaceGroupsState.saveTagGroupState(this, collapsed);
		
	}
	
}

//	Functions __________________________________________________________________

