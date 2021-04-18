//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { WorkspaceGroup, WorkspaceQuickPickItem } from '../@types/workspaces';

import * as files from '../common/files';

import { WorkspaceGroupsState } from '../states/WorkspaceGroupsState';
import { WorkspacesState } from '../states/WorkspacesState';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class WorkspacesDialog {
	
	private static current:WorkspacesDialog = null;
	
	public static create (workspacesState:WorkspacesState, workspaceGroupsState:WorkspaceGroupsState) {
		
		return WorkspacesDialog.current || (WorkspacesDialog.current = new WorkspacesDialog(workspacesState, workspaceGroupsState));
		
	}
	
	public constructor (private readonly workspacesState:WorkspacesState, private readonly workspaceGroupsState:WorkspaceGroupsState) {}
	
	public async pick () {
		
		const items = await this.createQuickPickItems();
		
		const item = await vscode.window.showQuickPick(items, {
			placeHolder: 'Select a project',
		});
		
		if (item) {
			if (item.paths) files.openAll(item.paths);
			else files.open(item.description);
		}
		
	}
	
	private async createQuickPickItems () {
		
		if (!this.workspacesState.cache) await this.workspacesState.detect();
		
		const items:WorkspaceQuickPickItem[] = [];
		const workspacesCache = this.workspacesState.cache;
		const workspaceGroups = this.workspaceGroupsState.get();
		
		workspaceGroups.forEach((workspaceGroup) => {
			
			const paths = workspaceGroup.paths;
			const names = workspacesCache.filter((workspace) => paths.includes(workspace.path));
			
			items.push({
				label: workspaceGroup.label,
				description: names.map((favorite) => favorite.label).join(', '),
				paths: workspaceGroup.paths,
			});
			
		});
		
		workspacesCache.forEach((project) => {
			
			items.push({
				label: project.label,
				description: project.path,
				detail: project.deleted ? '$(alert) Path does not exist' : '',
				paths: null,
			});
			
		});
		
		return items;
		
	}
	
	public async editWorkspaces (workspaceGroup:WorkspaceGroup) {
		
		const workspaces = this.workspacesState.cache || await this.workspacesState.detect();
		
		if (!workspaces.length) return;
		
		const items = workspaces.map((workspace) => {
			
			return {
				label: workspace.label,
				description: workspace.path,
				detail: workspace.deleted ? '$(alert) Path does not exist' : '',
				picked: workspaceGroup.paths.includes(workspace.path),
				workspace,
			};
			
		});
		
		const selectedItems = await vscode.window.showQuickPick(items, {
			placeHolder: `Select workspaces for ${workspaceGroup.label}`,
			canPickMany: true,
		});
		
		if (!selectedItems) return;
		
		this.workspaceGroupsState.editWorkspaces(workspaceGroup, selectedItems.map((item) => item.workspace));
		
	}
	
}

//	Functions __________________________________________________________________

