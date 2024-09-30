//	Imports ____________________________________________________________________

import { formatGroupDescription, formatWorkspaceDescription } from '../../../@l13/formats';

import type { WorkspacesTreeItems } from '../../../@types/workspaces';
import type { StaticSorter } from '../../../@types/WorkspacesSorter';

import type { WorkspaceGroupsState } from '../../../states/WorkspaceGroupsState';

import type { WorkspacesProvider } from '../../WorkspacesProvider';

import { WorkspaceGroupTreeItem } from '../groups/WorkspaceGroupTreeItem';

import { CurrentWorkspaceTreeItem } from '../items/CurrentWorkspaceTreeItem';
import { WorkspaceTreeItem } from '../items/WorkspaceTreeItem';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class GroupSorter implements StaticSorter {
	
	public groupRefs = [WorkspaceGroupTreeItem];
	
	public constructor (private readonly provider: WorkspacesProvider, private readonly workspaceGroupsState: WorkspaceGroupsState) {
		
		if (provider.initialState !== 'remember') {
			const collapsed = provider.initialState === 'collapsed';
			provider.workspaceGroups.forEach((workspaceGroup) => workspaceGroup.collapsed = collapsed);
		}
		
	}
	
	public addGroups (list: WorkspacesTreeItems[]) {
		
		const provider = this.provider;
		const slots = provider.slots;
		let paths: string[] = [];
		
		for (const workspaceGroup of provider.workspaceGroups) {
			const slot = slots.getByGroup(workspaceGroup);
			const description = formatGroupDescription(workspaceGroup.paths.length, slot, provider.groupDescriptionFormat);
			paths = paths.concat(workspaceGroup.paths);
			list.push(new WorkspaceGroupTreeItem(workspaceGroup, description));
		}
		
		provider.workspacesInGroups = [];
		provider.noGroupWorkspaces = [];
		
		for (const workspace of provider.workspaces) {
			const path = workspace.path;
			// Fixes description if workspace is remote
			if (provider.workspacePath === path && workspace.deleted) workspace.deleted = false;
			if (paths.includes(path)) provider.workspacesInGroups.push(workspace);
			else provider.noGroupWorkspaces.push(workspace);
		}
		
	}
	
	public addItems (list: WorkspacesTreeItems[], element: WorkspacesTreeItems) {
		
		const provider = this.provider;
		const colorPickerProject = provider.colorPickerProject;
		const slots = provider.slots;
		const tags = provider.tags;
		const workspacePath = provider.workspacePath;
		const workspaceDescriptionFormat = provider.workspaceDescriptionFormat;
		const paths = (<WorkspaceGroupTreeItem>element).group.paths;
		let hasCurrentWorkspace = false;
		
		for (const workspace of Object.values(provider.workspacesInGroups)) {
			if (!paths.includes(workspace.path)) continue;
			const slot = slots.getByWorkspace(workspace);
			const description = formatWorkspaceDescription(workspace, slot, tags, workspaceDescriptionFormat);
			
			if (!hasCurrentWorkspace && workspacePath && workspacePath === workspace.path) {
				hasCurrentWorkspace = true;
				list.push(new CurrentWorkspaceTreeItem(workspace, description, true));
			} else list.push(new WorkspaceTreeItem(workspace, description, true));
			
			if (colorPickerProject && colorPickerProject.path === workspace.path) {
				list.push(provider.colorPickerTreeItem);
			}
		}
		
	}
	
}

//	Functions __________________________________________________________________

