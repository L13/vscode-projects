//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import * as dialogs from '../common/dialogs';
import * as files from '../common/files';
import * as states from '../common/states';

import { sortCaseInsensitive } from '../@l13/arrays';
import { Favorite } from '../@types/favorites';
import { Project } from '../@types/workspaces';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class Favorites {
	
	private static _onDidUpdateFavorite:vscode.EventEmitter<Favorite> = new vscode.EventEmitter<Favorite>();
	public static readonly onDidUpdateFavorite:vscode.Event<Favorite> = Favorites._onDidUpdateFavorite.event;
	
	private static _onDidChangeFavorites:vscode.EventEmitter<undefined> = new vscode.EventEmitter<undefined>();
	public static readonly onDidChangeFavorites:vscode.Event<undefined> = Favorites._onDidChangeFavorites.event;
	
	public static async pickFavorite (context:vscode.ExtensionContext) {
		
		const favorites = states.getFavorites(context, true);
		const favoriteGroups = states.getFavoriteGroups(context);
		
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
			
			const item = await vscode.window.showQuickPick(groups.concat(items), { placeHolder: 'Select a project' });
				
			if (item) {
				if (item.paths) files.openAll(item.paths);
				else files.open(item.description);
			}
		}
		
	}
	
	public static addToFavorites (context:vscode.ExtensionContext, workspace:Project) {
		
		const favorites = states.getFavorites(context);
		
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
		
		states.updateFavorites(context, favorites);
		Favorites._onDidChangeFavorites.fire();
		
	}
	
	public static updateFavorite (context:vscode.ExtensionContext, workspace:Project) {
		
		const favorites = states.getFavorites(context);
		const fsPath = workspace.path;
		
		for (let i = 0; i < favorites.length; i++) {
			const favorite = favorites[i];
			if (favorite.path === fsPath) {
				if (!workspace.removed) {
					const type = favorite.type = workspace.type;
					if (type === 'folder' || type === 'folders') favorite.color = workspace.color;
					else delete favorite.color;
					favorite.label = workspace.label;
					favorites.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
				} else favorites.splice(i, 1);
				states.updateFavorites(context, favorites);
				Favorites._onDidChangeFavorites.fire();
				break;
			}
		}
		
	}
	
	public static async renameFavorite (context:vscode.ExtensionContext, favorite:Favorite) {
		
		const value = await vscode.window.showInputBox({ value: favorite.label });
		
		if (favorite.label === value || value === undefined) return;
		
		if (!value) return vscode.window.showErrorMessage(`Favorite with no name is not valid!`);
		
		favorite.label = value;
		Favorites.updateFavorite(context, favorite);
		Favorites._onDidUpdateFavorite.fire(favorite);
		
	}
	
	public static async removeFavorite (context:vscode.ExtensionContext, favorite:Favorite) {
		
		if (await dialogs.confirm(`Delete favorite "${favorite.label}"?`, 'Delete')) {
			const favorites = states.getFavorites(context);
			
			for (let i = 0; i < favorites.length; i++) {
				if (favorites[i].path === favorite.path) {
					favorites.splice(i, 1);
					states.updateFavorites(context, favorites);
					favorite.removed = true;
					Favorites._onDidUpdateFavorite.fire(favorite);
					Favorites._onDidChangeFavorites.fire();
					return;
				}
			}
		}
		
	}
	
	public static async clearFavorites (context:vscode.ExtensionContext) {
		
		if (await dialogs.confirm(`Delete all favorites and groups?'`, 'Delete')) {
			states.updateFavorites(context, []);
			states.updateFavoriteGroups(context, []);
			Favorites._onDidChangeFavorites.fire();
		}
		
	}
	
}

//	Functions __________________________________________________________________

