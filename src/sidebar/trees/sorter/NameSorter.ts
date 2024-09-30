//	Imports ____________________________________________________________________

import { formatWorkspaceDescription } from '../../../@l13/formats';

import type { WorkspacesTreeItems } from '../../../@types/workspaces';

import type { WorkspacesProvider } from '../../WorkspacesProvider';

import { CurrentWorkspaceTreeItem } from '../items/CurrentWorkspaceTreeItem';
import { WorkspaceTreeItem } from '../items/WorkspaceTreeItem';

import type { WorkspacesSorter } from '../../../@types/WorkspacesSorter';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class NameSorter implements WorkspacesSorter {
	
	public name = 'name';
	
	public groupRefs: any = [];
	
	public constructor (private readonly provider: WorkspacesProvider) {}
	
	public addGroups (list: WorkspacesTreeItems[]) {
		
		const provider = this.provider;
		const colorPickerProject = provider.colorPickerProject;
		const slots = provider.slots;
		const tags = provider.tags;
		const workspaceDescriptionFormat = provider.workspaceDescriptionFormat;
		const workspacePath = provider.workspacePath;
		let hasCurrentWorkspace = false;
		
		provider.noGroupWorkspaces.forEach((workspace) => {
			
			const slot = slots.getByWorkspace(workspace);
			const description = formatWorkspaceDescription(workspace, slot, tags, workspaceDescriptionFormat);
			
			if (!hasCurrentWorkspace && workspacePath && workspacePath === workspace.path) {
				hasCurrentWorkspace = true;
				list.push(new CurrentWorkspaceTreeItem(workspace, description));
			} else list.push(new WorkspaceTreeItem(workspace, description));
			
			if (colorPickerProject?.path === workspace.path) {
				list.push(provider.colorPickerTreeItem);
			}
			
		});
		
		if (!hasCurrentWorkspace && provider.isUnknownWorkspace) provider.addUnknownItem(list);
		
	}
	
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public addItems (list: WorkspacesTreeItems[], element: WorkspacesTreeItems) {
		
		//
		
	}
	
}

//	Functions __________________________________________________________________

