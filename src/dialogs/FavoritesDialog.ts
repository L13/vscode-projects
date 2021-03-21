//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { Favorite } from '../@types/favorites';

import * as dialogs from '../common/dialogs';
import * as files from '../common/files';
import * as settings from '../common/settings';

import { FavoriteGroupsState } from '../states/FavoriteGroupsState';
import { FavoritesState } from '../states/FavoritesState';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class FavoritesDialog {
	
	private static current:FavoritesDialog = null;
	
	public static create (favoritesStates:FavoritesState, favoriteGroupsState:FavoriteGroupsState) {
		
		return FavoritesDialog.current || (FavoritesDialog.current = new FavoritesDialog(favoritesStates, favoriteGroupsState));
		
	}
	
	public constructor (private readonly favoritesStates:FavoritesState, private readonly favoriteGroupsState:FavoriteGroupsState) {}
	
	public async pick () {
		
		const items = this.createQuickPickItems();
		
		if (!items.length) return;
		
		const item = await vscode.window.showQuickPick(items, {
			placeHolder: 'Select a project',
		});
			
		if (item) {
			if (item.paths) files.openAll(item.paths);
			else files.open(item.description);
		}
		
	}
	
	private createQuickPickItems () {
		
		const favoriteGroups = this.favoriteGroupsState.get();
		const favorites = this.favoritesStates.get();
		
		const groups = favoriteGroups.map((favoriteGroup) => {
				
			const paths = favoriteGroup.paths;
			const names = favorites.filter((favorite) => paths.includes(favorite.path));
			
			return {
				label: favoriteGroup.label,
				description: names.map((favorite) => favorite.label).join(', '),
				paths: favoriteGroup.paths,
			};
			
		});
		
		const items = favorites.map((favorite) => ({
			label: favorite.label,
			description: favorite.path,
			detail: favorite.deleted ? '$(alert) Path does not exist' : '',
			paths: null,
		}));
		
		return [...groups, ...items];
		
	}
	
	public async rename (favorite:Favorite) {
		
		const value = await vscode.window.showInputBox({ value: favorite.label });
		
		if (favorite.label === value || value === undefined) return;
		
		if (!value) {
			vscode.window.showErrorMessage(`Favorite with no name is not valid!`);
			return;
		}
		
		this.favoritesStates.rename(favorite, value);
		
		
	}
	
	public async remove (favorite:Favorite) {
		
		if (settings.get('confirmDeleteFavorite', true)) {
			const BUTTON_DELETE_DONT_SHOW_AGAIN = `Delete, don't show again`;
			const value = await dialogs.confirm(`Delete favorite "${favorite.label}"?`, 'Delete', BUTTON_DELETE_DONT_SHOW_AGAIN);
			if (!value) return;
			if (value === BUTTON_DELETE_DONT_SHOW_AGAIN) settings.update('confirmDeleteFavorite', false);
		}
		
		this.favoritesStates.remove(favorite);
		
	}
	
	public async clear () {
		
		if (await dialogs.confirm(`Delete all favorites and groups?'`, 'Delete')) {
			this.favoritesStates.clear();
		}
		
	}
	
}

//	Functions __________________________________________________________________

