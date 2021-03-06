//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { FavoriteGroup } from '../@types/favorites';

import * as dialogs from '../common/dialogs';

import { FavoriteGroupsState } from '../states/FavoriteGroupsState';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class FavoriteGroupsDialog {
	
	private static currentFavoriteGroupsDialog:FavoriteGroupsDialog = null;
	
	public static createFavoriteGroupsDialog (favoriteGroupsState:FavoriteGroupsState) {
		
		return FavoriteGroupsDialog.currentFavoriteGroupsDialog || (FavoriteGroupsDialog.currentFavoriteGroupsDialog = new FavoriteGroupsDialog(favoriteGroupsState));
		
	}
	
	public constructor (private readonly favoriteGroupsState:FavoriteGroupsState) {}
	
	public async add () {
		
		const label = await vscode.window.showInputBox({
			placeHolder: 'Please enter a name for the group.',
		});
		
		if (!label) return;
		
		this.favoriteGroupsState.addFavoriteGroup(label);
		
	}
	
	public async rename (favoriteGroup:FavoriteGroup) {
		
		const value = await vscode.window.showInputBox({
			placeHolder: 'Please enter a new name for the group.',
			value: favoriteGroup.label,
		});
		
		if (!value || favoriteGroup.label === value) return;
		
		this.favoriteGroupsState.rename(favoriteGroup, value);
		
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

