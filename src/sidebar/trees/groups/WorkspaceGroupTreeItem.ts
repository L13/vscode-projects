//	Imports ____________________________________________________________________

import { join } from 'path';
import { TreeItem, TreeItemCollapsibleState } from 'vscode';

import { Slot } from '../../../@types/hotkeys';
import { WorkspaceGroup } from '../../../@types/workspaces';

//	Variables __________________________________________________________________

const basePath = join(__dirname, '..', 'images', 'groups');
const iconPath = {
	light: join(basePath, `group-custom-light.svg`),
	dark: join(basePath, `group-custom-dark.svg`),
};

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class WorkspaceGroupTreeItem extends TreeItem {
	
	public contextValue = 'workspaceGroup';
	
	public iconPath = iconPath;
	
	public constructor (public readonly group:WorkspaceGroup, slot:Slot|null) {
		
		super(group.label, group.collapsed ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.Expanded);
		
		this.id = `workspace-group-${group.id}`;
		this.description = slot ? `[${slot.index}]` : '';
		
	}
	
}

//	Functions __________________________________________________________________

