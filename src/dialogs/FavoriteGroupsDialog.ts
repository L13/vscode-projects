//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { FavoriteGroup } from '../@types/favorites';
import { Project, WorkspaceGroup } from '../@types/workspaces';

import * as dialogs from '../common/dialogs';

import { FavoriteGroupsState } from '../states/FavoriteGroupsState';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class FavoriteGroupsDialog {
	
	private static currentFavoriteGroupsDialog:FavoriteGroupsDialog = null;
	
	public static create (favoriteGroupsState:FavoriteGroupsState) {
		
		return FavoriteGroupsDialog.currentFavoriteGroupsDialog || (FavoriteGroupsDialog.currentFavoriteGroupsDialog = new FavoriteGroupsDialog(favoriteGroupsState));
		
	}
	
	public constructor (private readonly favoriteGroupsState:FavoriteGroupsState) {}
	
	public async add () {
		
		const label = await vscode.window.showInputBox({
			placeHolder: 'Please enter a name for the group.',
		});
		
		if (!label) return;
		
		if (this.favoriteGroupsState.getByName(label)) {
			vscode.window.showInformationMessage(`Favorite group with the name "${label} exists!"`);
			return;
		}
		
		this.favoriteGroupsState.add(label);
		
	}
	
	private async replace (favoriteGroup:FavoriteGroup) {
		
		return !!await dialogs.confirm(`Replace favorite group "${favoriteGroup.label}"?`, 'Replace');
		
	}
	
	public async addFavoriteToGroup (favorite:Project) {
		
		const favoriteGroups = this.favoriteGroupsState.get();
		let favoriteGroup:FavoriteGroup = null;
		
		if (!favoriteGroups.length) {
			await this.add();
			favoriteGroup = this.favoriteGroupsState.get()[0];
		} else if (favoriteGroups.length === 1) {
			favoriteGroup = favoriteGroups[0];
		} else {
			favoriteGroup = await vscode.window.showQuickPick(favoriteGroups, {
				placeHolder: 'Select a favorite group',
			});
		}
		
		if (!favoriteGroup || favoriteGroup.paths.includes(favorite.path)) return;
		
		this.favoriteGroupsState.addFavorite(favorite, favoriteGroup);
		
	}
	
	public async addWorkspaceGroup (workspaceGroup:WorkspaceGroup, workspaces:Project[]) {
		
		if (this.favoriteGroupsState.getById(workspaceGroup.id)) return;
		
		const favoriteGroup = this.favoriteGroupsState.getByName(workspaceGroup.label);
		
		if (favoriteGroup && !await this.replace(favoriteGroup)) return;
		
		this.favoriteGroupsState.addWorkspaceGroup(workspaceGroup, workspaces, favoriteGroup);
		
	}
	
	public async rename (favoriteGroup:FavoriteGroup) {
		
		const label = await vscode.window.showInputBox({
			placeHolder: 'Please enter a new name for the group.',
			value: favoriteGroup.label,
		});
		
		if (!label || favoriteGroup.label === label) return;
		
		if (this.favoriteGroupsState.getByName(label)) {
			vscode.window.showErrorMessage(`Favorite group with name "${label}" exists!`);
		} else this.favoriteGroupsState.rename(favoriteGroup, label);
		
	}
	
	public async remove (favoriteGroup:FavoriteGroup) {
		
		const BUTTON_DELETE_GROUP_AND_FAVORITES = 'Delete Group and Favorites';
		const buttons = ['Delete'];
		
		if (favoriteGroup.paths.length) buttons.push(BUTTON_DELETE_GROUP_AND_FAVORITES);
		
		const value = await dialogs.confirm(`Delete favorite group "${favoriteGroup.label}"?`, ...buttons);
		
		if (value) this.favoriteGroupsState.remove(favoriteGroup, value === BUTTON_DELETE_GROUP_AND_FAVORITES);
		
	}
	
}

//	Functions __________________________________________________________________

