//	Imports ____________________________________________________________________

import { join } from 'path';
import { TreeItem } from 'vscode';

import { Slot } from '../../@types/hotkeys';
import { Project } from '../../@types/workspaces';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class ProjectTreeItem extends TreeItem {
	
	public command = {
		arguments: [this],
		command: 'l13Projects.openProject',
		title: 'Open Project',
	};
	
	public constructor (public readonly project:Project, public readonly slot:Slot|null) {
		
		super(project.label);
		
		const type = project.type;
		
		this.contextValue = `project-${type}`;
		
		let icon = `${type}`;
		
		if (type === 'folder') icon += `-color-${project.color || 0}`;
		
		this.iconPath = {
			light: join(__filename, '..', '..', 'images', `project-${icon}-light.svg`),
			dark: join(__filename, '..', '..', 'images', `project-${icon}-dark.svg`),
		};
		
	}
	
	public get tooltip () :string {
		
		return this.project.path;
		
	}
	
	public get description () :string {
		
		const info:string[] = [];
		
		if (this.slot) info.push(`[${this.slot.index}]`);
		if (this.project.deleted) info.push('Path does not exist');
		
		return info.join(' ');
		
	}
	
}

//	Functions __________________________________________________________________

