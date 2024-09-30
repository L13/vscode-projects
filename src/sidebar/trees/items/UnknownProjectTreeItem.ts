//	Imports ____________________________________________________________________

import { join } from 'path';
import { TreeItem } from 'vscode';

import type { Project } from '../../../@types/workspaces';

//	Variables __________________________________________________________________

const basePath = join(__dirname, '..', 'images', 'unknown');

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class UnknownProjectTreeItem extends TreeItem {
	
	public description = 'Unknown workspace';
	
	public constructor (public readonly project: Project) {
		
		super(project.label);
		
		const remote = project.remote;
		const icon = remote ? 'remote' : 'project';
		
		this.contextValue = `unknown-${remote ? 'remote-' : ''}project`;
		
		this.iconPath = {
			light: join(basePath, `unknown-${icon}-light.svg`),
			dark: join(basePath, `unknown-${icon}-dark.svg`),
		};
		
		this.tooltip = this.project.path;
		
	}
	
}

//	Functions __________________________________________________________________

