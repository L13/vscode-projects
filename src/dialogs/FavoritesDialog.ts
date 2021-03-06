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
	
	private static currentFavoritesDialog:FavoritesDialog = null;
	
	public static createFavoritesDialog (favoritesStates:FavoritesState, favoriteGroupsState:FavoriteGroupsState) {
		
		return FavoritesDialog.currentFavoritesDialog || (FavoritesDialog.currentFavoritesDialog = new FavoritesDialog(favoritesStates, favoriteGroupsState));
		
	}
	
	public constructor (private readonly favoritesStates:FavoritesState, private readonly favoriteGroupsState:FavoriteGroupsState) {}
	
	public async pick () {
		
		const favorites = this.favoritesStates.getAll();
		const favoriteGroups = this.favoriteGroupsState.getFavoriteGroups();
		
		if (favorites.length || favoriteGroups.length) {
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
			
			const item = await vscode.window.showQuickPick([...groups, ...items], {
				placeHolder: 'Select a project',
			});
				
			if (item) {
				if (item.paths) files.openAll(item.paths);
				else files.open(item.description);
			}
		}
		
	}
	
	public async rename (favorite:Favorite) {
		
		const value = await vscode.window.showInputBox({ value: favorite.label });
		
		if (favorite.label === value || value === undefined) return;
		
		if (!value) return vscode.window.showErrorMessage(`Favorite with no name is not valid!`);
		
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

