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
	
	public constructor (public readonly project:Project, public readonly slot:Slot|null) {
		
		super(project.label);
		
		const type = project.type;
		
		this.contextValue = `current-project-${type}`;
		
		const icon = `${type}`;
		
		// if (type === 'folder' || type === 'folders') icon += `-color-${project.color || 0}`;
		
		this.iconPath = {
			light: join(basePath, `current-project-${icon}-light.svg`),
			dark: join(basePath, `current-project-${icon}-dark.svg`),
		};
		
	}
	
	public get tooltip () :string {
		
		return this.project.path;
		
	}
	
	public get description () :string {
		
		const info:string[] = [];
		
		if (this.slot) info.push(`[${this.slot.index}]`);
		
		info.push('Current workspace');
		
		return info.join(' ');
		
	}
	
}

//	Functions __________________________________________________________________

