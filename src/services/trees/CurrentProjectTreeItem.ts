//	Imports ____________________________________________________________________

import { join } from 'path';
import { TreeItem } from 'vscode';

import { Project } from '../@types/projects';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class CurrentProjectTreeItem extends TreeItem {
	
	public contextValue = 'current-project';
	
	public description:string = 'Current workspace';
	
	public constructor (public readonly project:Project) {
		
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
	
}

//	Functions __________________________________________________________________

