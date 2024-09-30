//	Imports ____________________________________________________________________

import { TreeItem } from 'vscode';

import type { Favorite } from '../../../@types/favorites';

import { getContextValue, getIconPath } from '../../../common/treeview';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class FavoriteTreeItem extends TreeItem {
	
	public command = {
		arguments: [this],
		command: 'l13Projects.action.workspace.open',
		title: 'Open Favorite',
	};
	
	public constructor (public readonly project: Favorite, public description: string, isSubItem = false) {
		
		super(project.label);
		
		this.iconPath = getIconPath(project);
		this.contextValue = getContextValue(project, isSubItem, 'favorite');
		this.tooltip = project.path;
		
	}
	
}

//	Functions __________________________________________________________________

