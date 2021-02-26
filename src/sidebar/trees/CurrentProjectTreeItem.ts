//	Imports ____________________________________________________________________

import { join } from 'path';
import { TreeItem } from 'vscode';

import { Slot } from '../../@types/hotkeys';
import { Project } from '../../@types/workspaces';

//	Variables __________________________________________________________________

const basePath = join(__dirname, '..', 'images', 'current');

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class CurrentProjectTreeItem extends TreeItem {
	
	public constructor (public readonly project:Project, public readonly slot:Slot|null, isSubProject:boolean = false) {
		
		super(project.label);
		
		const type = project.type;
		let icon = `${type}`;
		
		if (type === 'folder' || type === 'folders') icon += `-color-${project.color || 0}`;
		
		this.contextValue = `current-${isSubProject ? 'sub' : ''}project-${type}`;
		this.tooltip = project.path;
		this.description = `${slot ? `[${slot.index}] ` : ''}Current workspace`;
		
		this.iconPath = {
			light: join(basePath, `current-project-${icon}-light.svg`),
			dark: join(basePath, `current-project-${icon}-dark.svg`),
		};
		
	}
	
}

//	Functions __________________________________________________________________

