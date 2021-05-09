//	Imports ____________________________________________________________________

import { join } from 'path';
import { TreeItem } from 'vscode';

import type { Project } from '../../../@types/workspaces';

//	Variables __________________________________________________________________

const basePath = join(__dirname, '..', 'images', 'current');

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class CurrentWorkspaceTreeItem extends TreeItem {
	
	public constructor (public readonly project:Project, info:string, isSubProject = false) {
		
		super(project.label);
		
		const type = project.type;
		const formattedInfo = info ? ` • ${info}` : '';
		let icon = `${type}`;
		
		if (type === 'folder' || type === 'folders') icon += `-color-${project.color || 0}`;
		
		this.contextValue = `current-${isSubProject ? 'sub' : ''}project-${type}`;
		this.tooltip = project.path;
		this.description = `◀ Current Workspace${formattedInfo}`;
		
		this.iconPath = {
			light: join(basePath, `current-project-${icon}-light.svg`),
			dark: join(basePath, `current-project-${icon}-dark.svg`),
		};
		
	}
	
}

//	Functions __________________________________________________________________

