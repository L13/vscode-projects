//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import * as dialogs from '../common/dialogs';
import * as files from '../common/files';
import * as settings from '../common/settings';
import * as states from '../common/states';

import { sortCaseInsensitive } from '../@l13/arrays';
import { Favorite } from '../@types/favorites';
import { Project } from '../@types/workspaces';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class FavoritesState {
	
	private static currentFavoritesState:FavoritesState = null;
	
	public static createFavoritesState (context:vscode.ExtensionContext) {
		
		return FavoritesState.currentFavoritesState || (FavoritesState.currentFavoritesState = new FavoritesState(context));
		
	}
	
	public constructor (private readonly context:vscode.ExtensionContext) {}
	
	private _onDidUpdateFavorite:vscode.EventEmitter<Favorite> = new vscode.EventEmitter<Favorite>();
	public readonly onDidUpdateFavorite:vscode.Event<Favorite> = this._onDidUpdateFavorite.event;
	
	private _onDidDeleteFavorite:vscode.EventEmitter<Favorite> = new vscode.EventEmitter<Favorite>();
	public readonly onDidDeleteFavorite:vscode.Event<Favorite> = this._onDidDeleteFavorite.event;
	
	private _onDidChangeFavorites:vscode.EventEmitter<Favorite[]> = new vscode.EventEmitter<Favorite[]>();
	public readonly onDidChangeFavorites:vscode.Event<Favorite[]> = this._onDidChangeFavorites.event;
	
	public getFavorites () {
		
		return states.getFavorites(this.context, true);
		
	}
	
	public async pickFavorite () {
		
		const favorites = states.getFavorites(this.context, true);
		const favoriteGroups = states.getFavoriteGroups(this.context);
		
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
	
	public addToFavorites (workspace:Project) {
		
		const favorites = states.getFavorites(this.context);
		
		if (favorites.some(({ path }) => path === workspace.path)) {
			return vscode.window.showErrorMessage(`Project "${workspace.label}" exists in favorites!`);
		}
		
		favorites.push({
			label: workspace.label,
			path: workspace.path,
			type: workspace.type,
			color: workspace.color,
		});
		
		favorites.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
		
		states.updateFavorites(this.context, favorites);
		this._onDidChangeFavorites.fire(favorites);
		
	}
	
	public updateFavorite (workspace:Project) {
		
		const favorites = states.getFavorites(this.context);
		const fsPath = workspace.path;
		
		for (const favorite of favorites) {
			if (favorite.path === fsPath) {
					const type = favorite.type = workspace.type;
					if (type === 'folder' || type === 'folders') favorite.color = workspace.color;
					else delete favorite.color;
					favorite.label = workspace.label;
					favorites.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
				states.updateFavorites(this.context, favorites);
				this._onDidChangeFavorites.fire(favorites);
				break;
			}
		}
		
	}
	
	public async renameFavorite (favorite:Favorite) {
		
		const value = await vscode.window.showInputBox({ value: favorite.label });
		
		if (favorite.label === value || value === undefined) return;
		
		if (!value) return vscode.window.showErrorMessage(`Favorite with no name is not valid!`);
		
		favorite.label = value;
		this.updateFavorite(favorite);
		this._onDidUpdateFavorite.fire(favorite);
		
	}
	
	public async removeFavorite (favorite:Favorite, force?:boolean) {
		
		let value:boolean|string = force;
		
		if (!value && settings.get('confirmDeleteFavorite', true)) {
			const BUTTON_DELETE_DONT_SHOW_AGAIN = `Delete, don't show again`;
			value = await dialogs.confirm(`Delete favorite "${favorite.label}"?`, 'Delete', BUTTON_DELETE_DONT_SHOW_AGAIN);
			if (!value) return;
			if (value === BUTTON_DELETE_DONT_SHOW_AGAIN) settings.update('confirmDeleteFavorite', false);
		}
		
		const favorites = states.getFavorites(this.context);
		const fsPath = favorite.path;
		
		for (let i = 0; i < favorites.length; i++) {
			if (favorites[i].path === fsPath) {
				favorites.splice(i, 1);
				states.updateFavorites(this.context, favorites);
				this._onDidDeleteFavorite.fire(favorite);
				this._onDidChangeFavorites.fire(favorites);
				break;
			}
		}
		
	}
	
	public async clearFavorites () {
		
		if (await dialogs.confirm(`Delete all favorites and groups?'`, 'Delete')) {
			states.updateFavorites(this.context, []);
			states.updateFavoriteGroups(this.context, []);
			this._onDidChangeFavorites.fire([]);
		}
		
	}
	
}

//	Functions __________________________________________________________________

