//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { sortCaseInsensitive } from '../@l13/arrays';

import type { Favorite } from '../@types/favorites';
import type { Project } from '../@types/workspaces';

import * as fse from '../common/fse';
import * as states from '../common/states';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class FavoritesState {
	
	private static current: FavoritesState = null;
	
	public static create (context: vscode.ExtensionContext) {
		
		return FavoritesState.current || (FavoritesState.current = new FavoritesState(context));
		
	}
	
	private constructor (private readonly context: vscode.ExtensionContext) {}
	
	private _onDidUpdateFavorite: vscode.EventEmitter<Favorite> = new vscode.EventEmitter<Favorite>();
	public readonly onDidUpdateFavorite: vscode.Event<Favorite> = this._onDidUpdateFavorite.event;
	
	private _onDidDeleteFavorite: vscode.EventEmitter<Favorite> = new vscode.EventEmitter<Favorite>();
	public readonly onDidDeleteFavorite: vscode.Event<Favorite> = this._onDidDeleteFavorite.event;
	
	private _onDidChangeFavorites: vscode.EventEmitter<Favorite[]> = new vscode.EventEmitter<Favorite[]>();
	public readonly onDidChangeFavorites: vscode.Event<Favorite[]> = this._onDidChangeFavorites.event;
	
	public get () {
		
		return states.getFavorites(this.context);
		
	}
	
	private save (favorites: Favorite[]) {
		
		states.updateFavorites(this.context, favorites);
		
	}
	
	public async refreshFavoriteExists () {
		
		const favorites = this.get();
		
		for (const favorite of favorites) {
			favorite.deleted = FavoritesState.isLocalFavorite(favorite) ? !await fse.exists(favorite.path) : false;
		}
		
		this.save(favorites);
		this._onDidChangeFavorites.fire(favorites);
		
	}
	
	public async cleanupUnknownPaths () {
		
		const favorites = this.get();
		const length = favorites.length;
		const filteredFavorites = [];
		
		for (const favorite of favorites) {
			if (FavoritesState.isLocalFavorite(favorite)) {
				if (await fse.exists(favorite.path)) filteredFavorites.push(favorite);
			}
		}
		
		if (length !== filteredFavorites.length) {
			states.updateProjects(this.context, filteredFavorites);
			this.save(filteredFavorites);
			this._onDidChangeFavorites.fire(filteredFavorites);
		}
		
	}
	
	public add (workspace: Project) {
		
		const favorites = this.get();
		
		for (const favorite of favorites) {
			if (favorite.path === workspace.path) return;
		}
		
		favorites.push({
			label: workspace.label,
			root: workspace.root,
			path: workspace.path,
			remote: workspace.remote,
			type: workspace.type,
			color: workspace.color,
			deleted: workspace.deleted,
		});
		
		favorites.sort(({ label: a }, { label: b }) => sortCaseInsensitive(a, b));
		
		this.save(favorites);
		this._onDidChangeFavorites.fire(favorites);
		
	}
	
	public update (workspace: Project) {
		
		const favorites = this.get();
		const fsPath = workspace.path;
		
		for (const favorite of favorites) {
			if (favorite.path === fsPath) {
				const type = favorite.type = workspace.type;
				if (type === 'folder' || type === 'folders') favorite.color = workspace.color;
				else delete favorite.color;
				favorite.label = workspace.label;
				favorites.sort(({ label: a }, { label: b }) => sortCaseInsensitive(a, b));
				this.save(favorites);
				this._onDidChangeFavorites.fire(favorites);
				break;
			}
		}
		
	}
	
	public rename (selectedFavorite: Favorite, label: string) {
		
		const favorites = this.get();
		const path = selectedFavorite.path;
		
		for (const favorite of favorites) {
			if (favorite.path === path) {
				favorite.label = label;
				favorites.sort(({ label: a }, { label: b }) => sortCaseInsensitive(a, b));
				this.save(favorites);
				this._onDidUpdateFavorite.fire(favorite);
				this._onDidChangeFavorites.fire(favorites);
				break;
			}
		}
		
	}
	
	public remove (selectedFavorite: Favorite) {
		
		const favorites = this.get();
		const path = selectedFavorite.path;
		
		for (let i = 0; i < favorites.length; i++) {
			if (favorites[i].path === path) {
				favorites.splice(i, 1);
				this.save(favorites);
				this._onDidDeleteFavorite.fire(selectedFavorite);
				this._onDidChangeFavorites.fire(favorites);
				break;
			}
		}
		
	}
	
	public clear () {
		
		this.save([]);
		states.updateFavoriteGroups(this.context, []);
		this._onDidChangeFavorites.fire([]);
		
	}
	
	public static isLocalFavorite (favorite: Favorite) {
		
		return favorite.type === 'folder'
			|| favorite.type === 'folders'
			|| favorite.type === 'git'
			|| favorite.type === 'subfolder'
			|| favorite.type === 'vscode'
			|| favorite.type === 'workspace';
		
	}
	
}

//	Functions __________________________________________________________________

