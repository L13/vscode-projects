//	Imports ____________________________________________________________________

import { join } from 'path';
import { TreeItem } from 'vscode';

import { Project } from './types';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class ProjectTreeItem extends TreeItem {
	
	public command = {
		arguments: [this],
		command: 'l13Projects.openProject',
		title: 'Open Project',
	};
	
	public constructor (public readonly project:Project) {
		
		super(project.label);
		
		const type = project.type;
		
		this.contextValue = `project-${type}`;
		
		this.iconPath = {
			light: join(__filename, '..', '..', 'images', `project-${type}-light.svg`),
			dark: join(__filename, '..', '..', 'images', `project-${type}-dark.svg`),
		};
		
	}
	
	public get tooltip () :string {
		
		return this.project.path;
		
	}
	
	public get description () :string {
		
		return this.project.deleted ? 'Path does not exist' : '';
		
	}
	
}

//	Functions __________________________________________________________________

