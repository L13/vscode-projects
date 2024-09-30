//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { formatGroupDescription, formatWorkspaceDescription } from '../../../@l13/formats';

import type { Dictionary } from '../../../@types/basics';
import type { PinnedGroup, ProjectTypes, WorkspacesTreeItems } from '../../../@types/workspaces';

import { basename, dirname } from '../../../common/uris';

import type { WorkspaceGroupsState } from '../../../states/WorkspaceGroupsState';

import type { WorkspacesProvider } from '../../WorkspacesProvider';

import { PinnedGroupTreeItem } from '../groups/PinnedGroupTreeItem';
import { RootGroupTreeItem } from '../groups/RootGroupTreeItem';
import { CurrentWorkspaceTreeItem } from '../items/CurrentWorkspaceTreeItem';
import { WorkspaceTreeItem } from '../items/WorkspaceTreeItem';

import type { WorkspacesSorter } from '../../../@types/WorkspacesSorter';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class RootSorter implements WorkspacesSorter {
	
	public name = 'root';
	
	public groupRefs = [PinnedGroupTreeItem, RootGroupTreeItem];
	
	private pinnedGroup: PinnedGroup = {
		label: 'Pinned Projects',
		projectTypes: [
			'azure',
			'codespace',
			'container',
			'docker',
			'kubernetes',
			'folder',
			'folders',
			'github',
			'remote',
			'ssh',
			'virtual',
			'wsl',
		],
		collapsed: false,
	};
	
	private rootGroups: Dictionary<boolean> = Object.create(null);
	
	public constructor (private readonly provider: WorkspacesProvider, private readonly workspaceGroupsState: WorkspaceGroupsState) {
		
		const rootGroupsStates = workspaceGroupsState.getRootGroups();
		
		if (provider.initialState === 'remember') {
			const pinnedGroupState = workspaceGroupsState.getPinnedGroup();
			this.pinnedGroup.collapsed = pinnedGroupState?.collapsed ?? false;
			rootGroupsStates.forEach((group) => this.rootGroups[group.root] = group.collapsed);
		} else {
			const collapsed = provider.initialState === 'collapsed';
			this.pinnedGroup.collapsed = collapsed;
			rootGroupsStates.forEach((group) => this.rootGroups[group.root] = collapsed);
		}
		
	}
	
	public addGroups (list: WorkspacesTreeItems[]) {
		
		const provider = this.provider;
		const isUnknownWorkspace = provider.isUnknownWorkspace;
		const groupDescriptionFormat = provider.groupDescriptionFormat;
		const noGroupWorkspaces = provider.noGroupWorkspaces;
		
		let amount = noGroupWorkspaces.filter((workspace) => this.pinnedGroup.projectTypes.includes(workspace.type)).length;
		
		if (isUnknownWorkspace) amount++;
		
		if (amount) {
			const description = formatGroupDescription(amount, null, groupDescriptionFormat);
			list.push(new PinnedGroupTreeItem(this.pinnedGroup, description));
		}
		
		const roots: string[] = [];
		
		const hasEveryWorkspaceRoot = noGroupWorkspaces.every((workspace) => {
			
			if (this.isPinnedProjectType(workspace.type)) return true;
			
			const root = workspace.root;
			
			if (!root) return false;
			
			if (!roots.includes(root)) roots.push(root);
			
			return true;
			
		});
		
		if (!hasEveryWorkspaceRoot) {
			vscode.window.showInformationMessage('Please refresh the workspace view. The current data has to be updated.', 'Refresh').then((value) => {
				
				if (value) vscode.commands.executeCommand('l13Projects.action.workspaces.refresh');
				
			});
		}
		
		roots.sort().forEach((root) => {
			
			list.push(new RootGroupTreeItem({
				label: basename(root),
				root,
				collapsed: this.rootGroups[root] ?? false,
			}, <string>dirname(root)));
			
		});
		
		this.workspaceGroupsState.cleanupUnknownRootGroupStates(roots);
		
	}
	
	public addItems (list: WorkspacesTreeItems[], element: WorkspacesTreeItems) {
		
		if (element instanceof PinnedGroupTreeItem) this.addPinnedGroupItems(list);
		else this.addRootGroupItems(list, <RootGroupTreeItem>element);
		
	}
	
	private addPinnedGroupItems (list: WorkspacesTreeItems[]) {
		
		const provider = this.provider;
		const colorPickerProject = provider.colorPickerProject;
		const slots = provider.slots;
		const tags = provider.tags;
		const workspaceDescriptionFormat = provider.workspaceDescriptionFormat;
		const workspacePath = provider.workspacePath;
		let hasCurrentWorkspace = false;
		
		provider.noGroupWorkspaces.forEach((workspace) => {
			
			const type = workspace.type;
			
			if (!this.pinnedGroup.projectTypes.includes(workspace.type)) return;
		
			const slot = slots.getByWorkspace(workspace);
			const description = formatWorkspaceDescription(workspace, slot, tags, workspaceDescriptionFormat);
			
			if (!hasCurrentWorkspace && workspacePath && workspacePath === workspace.path) {
				hasCurrentWorkspace = true;
				list.push(new CurrentWorkspaceTreeItem(workspace, description));
			} else list.push(new WorkspaceTreeItem(workspace, description));
			
			if (colorPickerProject && ['folder', 'folders'].includes(type) && colorPickerProject.path === workspace.path) {
				list.push(provider.colorPickerTreeItem);
			}
			
		});
		
		if (!hasCurrentWorkspace && provider.isUnknownWorkspace) provider.addUnknownItem(list);
		
	}
	
	private addRootGroupItems (list: WorkspacesTreeItems[], element: RootGroupTreeItem) {
		
		const provider = this.provider;
		const root = element.group.root;
		const slots = provider.slots;
		const tags = provider.tags;
		const workspaceDescriptionFormat = provider.workspaceDescriptionFormat;
		const workspacePath = provider.workspacePath;
		let hasCurrentWorkspace = false;
		
		provider.noGroupWorkspaces.forEach((workspace) => {
			
			const type = workspace.type;
					
			if (!this.isPinnedProjectType(type) && workspace.root === root) {
				const slot = slots.getByWorkspace(workspace);
				const description = formatWorkspaceDescription(workspace, slot, tags, workspaceDescriptionFormat);
				
				if (!hasCurrentWorkspace && workspacePath && workspacePath === workspace.path) {
					hasCurrentWorkspace = true;
					list.push(new CurrentWorkspaceTreeItem(workspace, description));
				} else list.push(new WorkspaceTreeItem(workspace, description));
			}
			
		});
		
	}
	
	private isPinnedProjectType (type: ProjectTypes) {
	
		return this.pinnedGroup.projectTypes.includes(type);
		
	}
	
}

//	Functions __________________________________________________________________

