//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { WorkspaceQuickPickItem } from '../@types/workspaces';

import * as files from '../common/files';

import { WorkspaceGroupsState } from '../states/WorkspaceGroupsState';
import { WorkspacesState } from '../states/WorkspacesState';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class WorkspacesDialog {
	
	private static currentWorkspacesDialog:WorkspacesDialog = null;
	
	public static createWorkspacesDialog (workspacesState:WorkspacesState, workspaceGroupsState:WorkspaceGroupsState) {
		
		return WorkspacesDialog.currentWorkspacesDialog || (WorkspacesDialog.currentWorkspacesDialog = new WorkspacesDialog(workspacesState, workspaceGroupsState));
		
	}
	
	public constructor (private readonly workspacesState:WorkspacesState,
		private readonly workspaceGroupsState:WorkspaceGroupsState) {}
	
	public async pick () {
		
		const items = await this.createQuickPickItems();
		
		const item = await vscode.window.showQuickPick(items, {
			placeHolder: 'Select a project',
		})
		
		if (item) {
			if (item.paths) files.openAll(item.paths);
			else files.open(item.description);
		}
		
	}
	
	private async createQuickPickItems () {
		
		if (!this.workspacesState.workspacesCache) await this.workspacesState.detectWorkspaces();
		
		const items:WorkspaceQuickPickItem[] = [];
		const workspacesCache = this.workspacesState.workspacesCache;
		const workspaceGroups = this.workspaceGroupsState.getWorkspaceGroups();
		
		workspaceGroups.forEach((workspaceGroup) => {
			
			const paths = workspaceGroup.paths;
			const names = workspacesCache.filter((workspace) => paths.includes(workspace.path));
			
			items.push({
				label: workspaceGroup.label,
				description: names.map((favorite) => favorite.label).join(', '),
				paths: workspaceGroup.paths,
			});
			
		});
		
		this.workspacesState.workspacesCache.forEach((project) => {
			
			items.push({
				label: project.label,
				description: project.path,
				detail: project.deleted ? '$(alert) Path does not exist' : '',
				paths: null,
			});
			
		});
		
		return items;
		
	}
	
}

//	Functions __________________________________________________________________

