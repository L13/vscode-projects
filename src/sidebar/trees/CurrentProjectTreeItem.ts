//	Imports ____________________________________________________________________

import { join } from 'path';
import { TreeItem } from 'vscode';

import { Slot } from '../../@types/hotkeys';
import { Project } from '../../@types/projects';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class CurrentProjectTreeItem extends TreeItem {
	
	public contextValue = 'current-project';
	
	public constructor (public readonly project:Project, public readonly slot:Slot|null) {
		
		super(project.label);
		
		const type = project.type;
		
		this.contextValue = `current-project-${type}`;
		
		this.iconPath = {
			light: join(__filename, '..', '..', 'images', `current-project-${type}-light.svg`),
			dark: join(__filename, '..', '..', 'images', `current-project-${type}-dark.svg`),
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

