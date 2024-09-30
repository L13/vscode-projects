//	Imports ____________________________________________________________________

import { formatGroupDescription, formatWorkspaceDescription } from '../../../@l13/formats';

import type { Dictionary } from '../../../@types/basics';
import type { SimpleGroup, SimpleGroupState, SimpleGroupTypes, WorkspacesTreeItems } from '../../../@types/workspaces';

import type { WorkspaceGroupsState } from '../../../states/WorkspaceGroupsState';

import type { WorkspacesProvider } from '../../WorkspacesProvider';

import { SimpleGroupTreeItem } from '../groups/SimpleGroupTreeItem';

import { CurrentWorkspaceTreeItem } from '../items/CurrentWorkspaceTreeItem';
import { WorkspaceTreeItem } from '../items/WorkspaceTreeItem';

import type { WorkspacesSorter } from '../../../@types/WorkspacesSorter';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class CategorySorter implements WorkspacesSorter {
	
	public name = 'category';
	
	public groupRefs = [SimpleGroupTreeItem];
	
	private mapSimpleGroups: Dictionary<SimpleGroupTypes> = Object.create(null);
	
	private simpleGroups: SimpleGroup[] = [
		{ label: 'Projects', type: 'project', projectTypes: ['folder', 'folders', 'remote', 'virtual'], collapsed: false },
		
		{ label: 'Azure', type: 'azure', projectTypes: ['azure'], collapsed: false },
		{ label: 'Docker', type: 'docker', projectTypes: ['docker'], collapsed: false },
		{ label: 'GitHub', type: 'github', projectTypes: ['codespace', 'github'], collapsed: false },
		{ label: 'Kubernetes', type: 'kubernetes', projectTypes: ['kubernetes'], collapsed: false },
		{ label: 'Container', type: 'container', projectTypes: ['container'], collapsed: false },
		{ label: 'SSH', type: 'ssh', projectTypes: ['ssh'], collapsed: false },
		{ label: 'WSL', type: 'wsl', projectTypes: ['wsl'], collapsed: false },
		
		{ label: 'Git', type: 'git', projectTypes: ['git'], collapsed: false },
		{ label: 'Visual Studio Code', type: 'vscode', projectTypes: ['vscode', 'workspace'], collapsed: false },
		{ label: 'Subfolders', type: 'subfolder', projectTypes: ['subfolder'], collapsed: false },
	];
	
	public constructor (private readonly provider: WorkspacesProvider, private readonly workspaceGroupsState: WorkspaceGroupsState) {
		
		this.simpleGroups.forEach((group) => {
			
			group.projectTypes.forEach((type) => this.mapSimpleGroups[type] = group.type);
			
		});
		
		if (provider.initialState === 'remember') {
			setCollapseGroupState(workspaceGroupsState.getSimpleGroups(), this.simpleGroups);
		} else {
			const collapsed = provider.initialState === 'collapsed';
			this.simpleGroups.forEach((group) => group.collapsed = collapsed);
		}
		
	}
	
	public addGroups (list: WorkspacesTreeItems[]) {
		
		const provider = this.provider;
		const isUnknownWorkspace = provider.isUnknownWorkspace;
		const groupDescriptionFormat = provider.groupDescriptionFormat;
		const noGroupWorkspaces = provider.noGroupWorkspaces;
		
		this.simpleGroups.forEach((group) => {
			
			let amount = noGroupWorkspaces.filter((workspace) => group.projectTypes.includes(workspace.type)).length;
			
			if (group.type === 'project' && isUnknownWorkspace) amount++;
			
			if (amount) {
				const description = formatGroupDescription(amount, null, groupDescriptionFormat);
				list.push(new SimpleGroupTreeItem(group, description));
			}
			
		});
		
	}
	
	public addItems (list: WorkspacesTreeItems[], element: WorkspacesTreeItems) {
		
		const provider = this.provider;
		const type = (<SimpleGroupTreeItem>element).group.type;
		const colorPickerProject = provider.colorPickerProject;
		const slots = provider.slots;
		const tags = provider.tags;
		const workspaceDescriptionFormat = provider.workspaceDescriptionFormat;
		const workspacePath = provider.workspacePath;
		let hasCurrentWorkspace = false;
		
		provider.noGroupWorkspaces.forEach((workspace) => {
						
			const simpleType = this.mapSimpleGroups[workspace.type];
		
			if (type === simpleType) {
				const slot = slots.getByWorkspace(workspace);
				const description = formatWorkspaceDescription(workspace, slot, tags, workspaceDescriptionFormat);
				
				if (!hasCurrentWorkspace && workspacePath && workspacePath === workspace.path) {
					hasCurrentWorkspace = true;
					list.push(new CurrentWorkspaceTreeItem(workspace, description));
				} else list.push(new WorkspaceTreeItem(workspace, description));
				
				if (colorPickerProject && simpleType === 'project' && colorPickerProject.path === workspace.path) {
					list.push(provider.colorPickerTreeItem);
				}
			}
			
		});
		
		if (type === 'project' && !hasCurrentWorkspace && provider.isUnknownWorkspace) {
			provider.addUnknownItem(list);
		}
		
	}
	
}

//	Functions __________________________________________________________________

function setCollapseGroupState (groupStates: SimpleGroupState[], groups: SimpleGroup[]) {
	
	for (const state of groupStates) {
		for (const group of groups) {
			if (state.type === group.type) {
				group.collapsed = state.collapsed;
				break;
			}
		}
	}
	
}