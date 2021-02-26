//	Imports ____________________________________________________________________

import { join } from 'path';
import { TreeItem } from 'vscode';

import { Slot } from '../../@types/hotkeys';
import { Project } from '../../@types/workspaces';

//	Variables __________________________________________________________________

const basePath = join(__dirname, '..', 'images', 'types');

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class ProjectTreeItem extends TreeItem {
	
	public command = {
		arguments: [this],
		command: 'l13Projects.action.workspace.open',
		title: 'Open Project',
	};
	
	public constructor (public readonly project:Project, public readonly slot:Slot|null, isSubProject:boolean = false) {
		
		super(project.label);
		
		const type = project.type;
		const info:string[] = [];
		let icon = `${type}`;
		
		if (slot) info.push(`[${slot.index}]`);
		if (project.deleted) info.push('Path does not exist');
		
		if (type === 'folder' || type === 'folders') icon += `-color-${project.color || 0}`;
		
		this.contextValue = `${isSubProject ? 'sub' : ''}project-${type}`;
		this.tooltip = project.path;
		this.description = info.join(' ');
		
		this.iconPath = {
			light: join(basePath, `project-${icon}-light.svg`),
			dark: join(basePath, `project-${icon}-dark.svg`),
		};
		
	}
	
}

//	Functions __________________________________________________________________

