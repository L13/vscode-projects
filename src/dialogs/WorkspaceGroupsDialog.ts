//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { Project, WorkspaceGroup } from '../@types/workspaces';

import * as dialogs from '../common/dialogs';

import { FavoriteGroupsState } from '../states/FavoriteGroupsState';
import { WorkspaceGroupsState } from '../states/WorkspaceGroupsState';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class WorkspaceGroupsDialog {
	
	private static current:WorkspaceGroupsDialog = null;
	
	public static create (workspaceGroupsState:WorkspaceGroupsState, favoriteGroupsState:FavoriteGroupsState) {
		
		return WorkspaceGroupsDialog.current || (WorkspaceGroupsDialog.current = new WorkspaceGroupsDialog(workspaceGroupsState, favoriteGroupsState));
		
	}
	
	public constructor (private readonly workspaceGroupsState:WorkspaceGroupsState, private readonly favoriteGroupsState:FavoriteGroupsState) {}
	
	public async add () {
		
		const label = await vscode.window.showInputBox({
			placeHolder: 'Please enter a name for the group.',
		});
		
		if (!label) return;
		
		if (this.workspaceGroupsState.getByName(label)) {
			vscode.window.showInformationMessage(`Workspace group with the name "${label}" exists!`);
			return;
		}
		
		if (this.favoriteGroupsState.getByName(label)) {
			vscode.window.showInformationMessage(`Favorite group with the name "${label}" exists!`);
			return;
		}
		
		this.workspaceGroupsState.add(label);
		
	}
	
	public async addWorkspaceToGroup (workspace:Project) {
		
		const workspaceGroups = this.workspaceGroupsState.get();
		let workspaceGroup:WorkspaceGroup = null;
		
		if (!workspaceGroups.length) {
			await this.add();
			workspaceGroup = this.workspaceGroupsState.get()[0];
		} else if (workspaceGroups.length === 1) {
			workspaceGroup = workspaceGroups[0];
		} else {
			workspaceGroup = await vscode.window.showQuickPick(workspaceGroups, {
				placeHolder: 'Select a workspace group',
			});
		}
		
		if (!workspaceGroup || workspaceGroup.paths.includes(workspace.path)) return;
		
		this.workspaceGroupsState.addWorkspace(workspace, workspaceGroup);
		
	}
	
	public async rename (workspaceGroup:WorkspaceGroup) {
		
		const label = await vscode.window.showInputBox({
			placeHolder: 'Please enter a new name for the group.',
			value: workspaceGroup.label,
		});
		
		if (!label || workspaceGroup.label === label) return;
		
		if (this.workspaceGroupsState.getByName(label)) {
			vscode.window.showErrorMessage(`Workspace group with name "${label}" exists!`);
			return;
		}
		
		if (this.favoriteGroupsState.getByName(label)) {
			vscode.window.showErrorMessage(`Favorite group with name "${label}" exists!`);
			return;
		}
		
		this.workspaceGroupsState.rename(workspaceGroup, label);
		
	}
	
	public async remove (workspaceGroup:WorkspaceGroup) {
		
		if (await dialogs.confirm(`Delete workspace group "${workspaceGroup.label}"?`, 'Delete')) {
			this.workspaceGroupsState.remove(workspaceGroup);
		}
		
	}
	
	public async clear () {
		
		if (await dialogs.confirm(`Delete all workspace groups?'`, 'Delete')) {
			this.workspaceGroupsState.clear();
		}
		
	}
	
}

//	Functions __________________________________________________________________

