//	Imports ____________________________________________________________________

import { TreeItem } from 'vscode';

import type { Project } from '../../../@types/workspaces';

import { getContextValue, getIconPath } from '../../../common/treeview';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class WorkspaceTreeItem extends TreeItem {
	
	public command = {
		arguments: [this],
		command: 'l13Projects.action.workspace.open',
		title: 'Open Workspace',
	};
	
	public constructor (public readonly project: Project, public description: string, isSubItem = false) {
		
		super(project.label);
		
		this.iconPath = getIconPath(project);
		this.contextValue = getContextValue(project, isSubItem);
		this.tooltip = project.path;
		
	}
	
}

//	Functions __________________________________________________________________

