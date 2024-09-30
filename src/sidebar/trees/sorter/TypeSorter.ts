//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { formatGroupDescription, formatWorkspaceDescription } from '../../../@l13/formats';

import type { TypeGroup, TypeGroupState, WorkspacesTreeItems } from '../../../@types/workspaces';

import * as workspaces from '../../../common/workspaces';

import type { WorkspaceGroupsState } from '../../../states/WorkspaceGroupsState';

import type { WorkspacesProvider } from '../../WorkspacesProvider';

import { TypeGroupTreeItem } from '../groups/TypeGroupTreeItem';
import { CurrentWorkspaceTreeItem } from '../items/CurrentWorkspaceTreeItem';
import { WorkspaceTreeItem } from '../items/WorkspaceTreeItem';

import type { WorkspacesSorter } from '../../../@types/WorkspacesSorter';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class TypeSorter implements WorkspacesSorter {
	
	public name = 'type';
	
	public groupRefs = [TypeGroupTreeItem];
	
	private typeGroups: TypeGroup[] = [
		{ label: 'Projects', type: 'folder', collapsed: false, remote: false },
		{ label: 'Workspace Projects', type: 'folders', collapsed: false, remote: false },
		{ label: 'Remote Projects', type: 'remote', collapsed: false, remote: true },
		{ label: 'Virtual Projects', type: 'virtual', collapsed: false, remote: true },
		
		{ label: 'Azure', type: 'azure', collapsed: false, remote: true },
		{ label: 'Container', type: 'container', collapsed: false, remote: true },
		{ label: 'Docker', type: 'docker', collapsed: false, remote: true },
		{ label: 'GitHub Codespaces', type: 'codespace', collapsed: false, remote: true },
		{ label: 'GitHub Repositories', type: 'github', collapsed: false, remote: true },
		{ label: 'Kubernetes', type: 'kubernetes', collapsed: false, remote: true },
		{ label: 'SSH', type: 'ssh', collapsed: false, remote: true },
		{ label: 'WSL', type: 'wsl', collapsed: false, remote: true },
		
		{ label: 'Git', type: 'git', collapsed: false, remote: false },
		{ label: 'Visual Studio Code', type: 'vscode', collapsed: false, remote: false },
		{ label: 'Code Workspaces', type: 'workspace', collapsed: false, remote: false },
		{ label: 'Subfolders', type: 'subfolder', collapsed: false, remote: false },
	];
	
	public constructor (private readonly provider: WorkspacesProvider, private readonly workspaceGroupsState: WorkspaceGroupsState) {
		
		if (provider.initialState === 'remember') {
			setCollapseGroupState(workspaceGroupsState.getTypeGroups(), this.typeGroups);
		} else {
			const collapsed = provider.initialState === 'collapsed';
			this.typeGroups.forEach((group) => group.collapsed = collapsed);
		}
		
	}
	
	public addGroups (list: WorkspacesTreeItems[]) {
		
		const provider = this.provider;
		const isUnknownWorkspace = provider.isUnknownWorkspace;
		const isCodeWorkspace = workspaces.isCodeWorkspace(provider.workspacePath);
		const groupDescriptionFormat = provider.groupDescriptionFormat;
		const noGroupWorkspaces = provider.noGroupWorkspaces;
		
		this.typeGroups.forEach((group) => {
			
			let amount = noGroupWorkspaces.filter((workspace) => workspace.type === group.type).length;
			
			if (group.type === 'folder' && isUnknownWorkspace && !isCodeWorkspace) amount++;
			if (group.type === 'folders' && isUnknownWorkspace && isCodeWorkspace) amount++;
			
			if (amount) {
				const description = formatGroupDescription(amount, null, groupDescriptionFormat);
				list.push(new TypeGroupTreeItem(group, description));
			}
			
		});
		
	}
	
	public addItems (list: WorkspacesTreeItems[], element: WorkspacesTreeItems) {
		
		const provider = this.provider;
		const type = (<TypeGroupTreeItem>element).group.type;
		const colorPickerProject = provider.colorPickerProject;
		const workspaceFile = vscode.workspace.workspaceFile;
		const slots = provider.slots;
		const tags = provider.tags;
		const workspaceDescriptionFormat = provider.workspaceDescriptionFormat;
		const workspacePath = provider.workspacePath;
		let hasCurrentWorkspace = false;
		
		provider.noGroupWorkspaces.forEach((workspace) => {
			
			if (type === workspace.type) {
				const slot = slots.getByWorkspace(workspace);
				const description = formatWorkspaceDescription(workspace, slot, tags, workspaceDescriptionFormat);
				
				if (!hasCurrentWorkspace && workspacePath && workspacePath === workspace.path) {
					hasCurrentWorkspace = true;
					list.push(new CurrentWorkspaceTreeItem(workspace, description));
				} else list.push(new WorkspaceTreeItem(workspace, description));
				
				if (colorPickerProject && (type === 'folder' || type === 'folders') && colorPickerProject.path === workspace.path) {
					list.push(provider.colorPickerTreeItem);
				}
			}
			
		});
		
		if ((type === 'folder' && !workspaceFile || type === 'folders' && workspaceFile)
		&& !hasCurrentWorkspace && provider.isUnknownWorkspace) {
			provider.addUnknownItem(list);
		}
		
	}
	
}

//	Functions __________________________________________________________________

function setCollapseGroupState (groupStates: TypeGroupState[], groups: TypeGroup[]) {
	
	for (const state of groupStates) {
		for (const group of groups) {
			if (state.type === group.type) {
				group.collapsed = state.collapsed;
				break;
			}
		}
	}
	
}