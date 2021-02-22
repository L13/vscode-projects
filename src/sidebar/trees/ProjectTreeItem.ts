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
	
	public constructor (public readonly project:Project, public readonly slot:Slot|null) {
		
		super(project.label);
		
		const type = project.type;
		
		this.contextValue = `project-${type}`;
		
		let icon = `${type}`;
		
		if (type === 'folder' || type === 'folders') icon += `-color-${project.color || 0}`;
		
		this.iconPath = {
			light: join(basePath, `project-${icon}-light.svg`),
			dark: join(basePath, `project-${icon}-dark.svg`),
		};
		
		this.tooltip = project.path;
		
	}
	
	public get description () :string {
		
		const info:string[] = [];
		
		if (this.slot) info.push(`[${this.slot.index}]`);
		if (this.project.deleted) info.push('Path does not exist');
		
		return info.join(' ');
		
	}
	
}

//	Functions __________________________________________________________________

