//	Imports ____________________________________________________________________

import { TreeItem } from 'vscode';

import type { Favorite } from '../../../@types/favorites';

import { getContextValue, getDescription, getIconPath } from '../../../common/treeview';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class CurrentFavoriteTreeItem extends TreeItem {
	
	public constructor (public readonly project: Favorite, info: string, isSubItem = false) {
		
		super(project.label);
		
		this.iconPath = getIconPath(project, true);
		this.description = getDescription(info);
		this.contextValue = `current-${getContextValue(project, isSubItem, 'favorite')}`;
		this.tooltip = project.path;
		
	}
	
}

//	Functions __________________________________________________________________

