//	Imports ____________________________________________________________________

import { join } from 'path';
import { TreeItem } from 'vscode';

import type { Project } from '../../../@types/workspaces';

//	Variables __________________________________________________________________

const basePath = join(__dirname, '..', 'images', 'unknown');
const iconPath = {
	light: join(basePath, 'unknown-project-light.svg'),
	dark: join(basePath, 'unknown-project-dark.svg'),
};

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class UnknownProjectTreeItem extends TreeItem {
	
	public contextValue = 'unknown-project';
	
	public iconPath = iconPath;
	
	public description = 'Unknown workspace';
	
	public constructor (public readonly project:Project) {
		
		super(project.label);
		
		this.tooltip = this.project.path;
		
	}
	
}

//	Functions __________________________________________________________________

