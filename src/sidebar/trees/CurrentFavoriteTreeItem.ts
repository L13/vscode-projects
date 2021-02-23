//	Imports ____________________________________________________________________

import { join } from 'path';
import { TreeItem } from 'vscode';

import { Favorite } from '../../@types/favorites';
import { Slot } from '../../@types/hotkeys';

//	Variables __________________________________________________________________

const basePath = join(__dirname, '..', 'images', 'current');

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class CurrentFavoriteTreeItem extends TreeItem {
	
	public constructor (public readonly project:Favorite, public readonly slot:Slot|null) {
		
		super(project.label);
		
		const type = project.type;
		let icon = `${type}`;
		
		if (type === 'folder' || type === 'folders') icon += `-color-${project.color || 0}`;
		
		this.contextValue = `current-${project.groupId != null ? 'sub' : ''}favorite-${type}`;
		this.tooltip = project.path;
		this.description = `${slot ? `[${slot.index}] ` : ''}Current workspace`;
		
		this.iconPath = {
			light: join(basePath, `current-project-${icon}-light.svg`),
			dark: join(basePath, `current-project-${icon}-dark.svg`),
		};
		
	}
	
}

//	Functions __________________________________________________________________

