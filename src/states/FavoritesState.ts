//	Imports ____________________________________________________________________

import * as fs from 'fs';
import * as vscode from 'vscode';

import { sortCaseInsensitive } from '../@l13/arrays';

import { Favorite } from '../@types/favorites';
import { Project } from '../@types/workspaces';

import * as states from '../common/states';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class FavoritesState {
	
	private static current:FavoritesState = null;
	
	public static create (context:vscode.ExtensionContext) {
		
		return FavoritesState.current || (FavoritesState.current = new FavoritesState(context));
		
	}
	
	public constructor (private readonly context:vscode.ExtensionContext) {}
	
	private _onDidUpdateFavorite:vscode.EventEmitter<Favorite> = new vscode.EventEmitter<Favorite>();
	public readonly onDidUpdateFavorite:vscode.Event<Favorite> = this._onDidUpdateFavorite.event;
	
	private _onDidDeleteFavorite:vscode.EventEmitter<Favorite> = new vscode.EventEmitter<Favorite>();
	public readonly onDidDeleteFavorite:vscode.Event<Favorite> = this._onDidDeleteFavorite.event;
	
	private _onDidChangeFavorites:vscode.EventEmitter<Favorite[]> = new vscode.EventEmitter<Favorite[]>();
	public readonly onDidChangeFavorites:vscode.Event<Favorite[]> = this._onDidChangeFavorites.event;
	
	public get () {
		
		return states.getFavorites(this.context);
		
	}
	
	private save (favorites:Favorite[]) {
		
		states.updateFavorites(this.context, favorites);
		
	}
	
	public refreshFavoriteExists () {
		
		const favorites = this.get();
		
		favorites.forEach((favorite) => favorite.deleted = !fs.existsSync(favorite.path));
		
		this.save(favorites);
		this._onDidChangeFavorites.fire(favorites);
		
	}
	
	public add (workspace:Project) {
		
		const favorites = this.get();
		
		for (const favorite of favorites) {
			if (favorite.path === workspace.path) return;
		}
		
		favorites.push({
			label: workspace.label,
			path: workspace.path,
			type: workspace.type,
			color: workspace.color,
		});
		
		favorites.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
		
		this.save(favorites);
		this._onDidChangeFavorites.fire(favorites);
		
	}
	
	public update (workspace:Project) {
		
		const favorites = this.get();
		const fsPath = workspace.path;
		
		for (const favorite of favorites) {
			if (favorite.path === fsPath) {
				const type = favorite.type = workspace.type;
				if (type === 'folder' || type === 'folders') favorite.color = workspace.color;
				else delete favorite.color;
				favorite.label = workspace.label;
				favorites.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
				this.save(favorites);
				this._onDidChangeFavorites.fire(favorites);
				break;
			}
		}
		
	}
	
	public rename (favorite:Favorite, label:string) {
		
		const favorites = this.get();
		const fsPath = favorite.path;
		
		for (const fav of favorites) {
			if (fav.path === fsPath) {
				fav.label = label;
				favorites.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
				this.save(favorites);
				this._onDidUpdateFavorite.fire(fav);
				this._onDidChangeFavorites.fire(favorites);
				break;
			}
		}
		
	}
	
	public remove (favorite:Favorite) {
		
		const favorites = this.get();
		const fsPath = favorite.path;
		
		for (let i = 0; i < favorites.length; i++) {
			if (favorites[i].path === fsPath) {
				favorites.splice(i, 1);
				this.save(favorites);
				this._onDidDeleteFavorite.fire(favorite);
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
	
}

//	Functions __________________________________________________________________

