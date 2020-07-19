//	Imports ____________________________________________________________________

import { join } from 'path';
import { TreeItem } from 'vscode';

import { Project } from '../../@types/workspaces';

//	Variables __________________________________________________________________

const basePath = join(__dirname, '..', 'images', 'unknown');
const iconPath = {
	light: join(basePath, `unknown-project-light.svg`),
	dark: join(basePath, `unknown-project-dark.svg`),
};

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class UnknownProjectTreeItem extends TreeItem {
	
	public contextValue = 'unknown-project';
	
	public iconPath = iconPath;
	
	public description:string = 'Unknown workspace';
	
	public constructor (public readonly project:Project) {
		
		super(project.label);
		
	}
	
	public get tooltip () :string {
		
		return this.project.path;
		
	}
	
}

//	Functions __________________________________________________________________

