//	Imports ____________________________________________________________________

import { join } from 'path';
import { TreeItem } from 'vscode';

import { Project } from '../../../@types/workspaces';

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
	
	public constructor (public readonly project:Project, info:string, isSubProject:boolean = false) {
		
		super(project.label);
		
		const type = project.type;
		let icon = `${type}`;
		
		if (type === 'folder' || type === 'folders') icon += `-color-${project.color || 0}`;
		
		this.contextValue = `${isSubProject ? 'sub' : ''}project-${type}`;
		this.tooltip = project.path;
		this.description = info;
		
		this.iconPath = {
			light: join(basePath, `project-${icon}-light.svg`),
			dark: join(basePath, `project-${icon}-dark.svg`),
		};
		
	}
	
}

//	Functions __________________________________________________________________

