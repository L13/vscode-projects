//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { FavoriteGroup } from '../@types/favorites';
import { Project, WorkspaceGroup } from '../@types/workspaces';

import * as dialogs from '../common/dialogs';

import { FavoriteGroupsState } from '../states/FavoriteGroupsState';
import { WorkspaceGroupsState } from '../states/WorkspaceGroupsState';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class FavoriteGroupsDialog {
	
	private static current:FavoriteGroupsDialog = null;
	
	public static create (favoriteGroupsState:FavoriteGroupsState, workspaceGroupsState:WorkspaceGroupsState) {
		
		return FavoriteGroupsDialog.current || (FavoriteGroupsDialog.current = new FavoriteGroupsDialog(favoriteGroupsState, workspaceGroupsState));
		
	}
	
	public constructor (private readonly favoriteGroupsState:FavoriteGroupsState, private readonly workspaceGroupsState:WorkspaceGroupsState) {}
	
	public async add () {
		
		const label = await vscode.window.showInputBox({
			placeHolder: 'Please enter a name for the group.',
		});
		
		if (!label) return;
		
		if (this.favoriteGroupsState.getByName(label)) {
			vscode.window.showInformationMessage(`Favorite group with the name "${label}" exists!`);
			return;
		}
		
		if (this.workspaceGroupsState.getByName(label)) {
			vscode.window.showInformationMessage(`Workspace group with the name "${label}" exists!`);
			return;
		}
		
		this.favoriteGroupsState.add(label);
		
		return this.favoriteGroupsState.getByName(label);
		
	}
	
	public async addFavoriteToGroup (favorite:Project) {
		
		const favoriteGroups = this.favoriteGroupsState.get();
		let favoriteGroup:FavoriteGroup = null;
		
		if (favoriteGroups.length) {
			const newFavoriteGroupItem = { label: '$(add) New Favorite Group...' };
			const items = [
				newFavoriteGroupItem,
				...favoriteGroups
			];
			const selectedItem = await vscode.window.showQuickPick(items, {
				placeHolder: 'Select a favorite group',
			});
			if (selectedItem === newFavoriteGroupItem) {
				favoriteGroup = await this.add();
			} else favoriteGroup = <FavoriteGroup>selectedItem;
		} else favoriteGroup = await this.add();
		
		if (!favoriteGroup || favoriteGroup.paths.includes(favorite.path)) return;
		
		this.favoriteGroupsState.addFavorite(favorite, favoriteGroup);
		
	}
	
	public async addWorkspaceGroup (workspaceGroup:WorkspaceGroup, workspaces:Project[]) {
		
		if (this.favoriteGroupsState.getById(workspaceGroup.id)) return;
		
		this.favoriteGroupsState.addWorkspaceGroup(workspaceGroup, workspaces);
		
	}
	
	public async rename (favoriteGroup:FavoriteGroup) {
		
		const label = await vscode.window.showInputBox({
			placeHolder: 'Please enter a new name for the group.',
			value: favoriteGroup.label,
		});
		
		if (!label || favoriteGroup.label === label) return;
		
		if (this.workspaceGroupsState.getByName(label)) {
			vscode.window.showErrorMessage(`Workspace group with name "${label}" exists!`);
			return;
		}
		
		if (this.favoriteGroupsState.getByName(label)) {
			vscode.window.showErrorMessage(`Favorite group with name "${label}" exists!`);
			return;
		}
		
		this.favoriteGroupsState.rename(favoriteGroup, label);
		
	}
	
	public async remove (favoriteGroup:FavoriteGroup) {
		
		const buttonDeleteGroupAndFavorites = 'Delete Group and Favorites';
		const buttons = ['Delete'];
		
		if (favoriteGroup.paths.length) buttons.push(buttonDeleteGroupAndFavorites);
		
		const value = await dialogs.confirm(`Delete favorite group "${favoriteGroup.label}"?`, ...buttons);
		
		if (value) this.favoriteGroupsState.remove(favoriteGroup, value === buttonDeleteGroupAndFavorites);
		
	}
	
}

//	Functions __________________________________________________________________

