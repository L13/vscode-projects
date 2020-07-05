//	Imports ____________________________________________________________________

import { join } from 'path';
import { TreeItem } from 'vscode';

import { Project } from '../../@types/workspaces';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class UnknownProjectTreeItem extends TreeItem {
	
	public contextValue = 'unknown-project';
	
	public description:string = 'Unknown workspace';
	
	public constructor (public readonly project:Project) {
		
		super(project.label);
		
		this.iconPath = {
			light: join(__filename, '..', '..', 'images', 'unknown', `unknown-project-light.svg`),
			dark: join(__filename, '..', '..', 'images', 'unknown', `unknown-project-dark.svg`),
		};
		
	}
	
	public get tooltip () :string {
		
		return this.project.path;
		
	}
	
}

//	Functions __________________________________________________________________

