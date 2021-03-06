//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import * as settings from '../common/settings';

import { InitialState } from '../@types/common';
import { Favorite, FavoriteGroup, FavoritesStates, FavoritesTreeItems, RefreshFavoritesStates } from '../@types/favorites';
import { HotkeySlotsState } from '../states/HotkeySlotsState';

import { CurrentFavoriteTreeItem } from './trees/CurrentFavoriteTreeItem';
import { FavoriteGroupTreeItem } from './trees/FavoriteGroupTreeItem';
import { FavoriteTreeItem } from './trees/FavoriteTreeItem';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class FavoritesProvider implements vscode.TreeDataProvider<FavoritesTreeItems> {
	
	private _onDidChangeTreeData:vscode.EventEmitter<FavoritesTreeItems|undefined> = new vscode.EventEmitter<FavoritesTreeItems|undefined>();
	public readonly onDidChangeTreeData:vscode.Event<FavoritesTreeItems|undefined> = this._onDidChangeTreeData.event;
	
	private favorites:Favorite[] = [];
	private favoriteGroups:FavoriteGroup[] = [];
	private slots:HotkeySlotsState = null;
	
	public static currentFavoritesProvider:FavoritesProvider;
	
	public static createProvider (states:FavoritesStates) {
		
		return FavoritesProvider.currentFavoritesProvider || (FavoritesProvider.currentFavoritesProvider = new FavoritesProvider(states));
		
	}
	
	private constructor ({ favorites, favoriteGroups, hotkeySlots }:FavoritesStates) {
		
		this.favorites = favorites;
		this.favoriteGroups = favoriteGroups;
		this.slots = hotkeySlots;
		
		const initialState:InitialState = settings.get('initialFavoritesGroupState', 'Remember');
		
		if (initialState !== 'Remember') {
			this.favoriteGroups.forEach((favoriteGroup) => favoriteGroup.collapsed = initialState === 'Collapsed');
		}
		
	}
	
	public refresh (refreshStates?:RefreshFavoritesStates) {
		
		if (refreshStates?.favorites) this.favorites = refreshStates.favorites;
		if (refreshStates?.favoriteGroups) this.favoriteGroups = refreshStates.favoriteGroups;
		
		this._onDidChangeTreeData.fire(undefined);
		
	}
	
	public getTreeItem (element:FavoritesTreeItems) :FavoritesTreeItems {
		
		return element;
		
	}
	
	public getChildren (element?:FavoritesTreeItems) :Thenable<FavoritesTreeItems[]> {
		
		const list:FavoritesTreeItems[] = [];
		
		if (!this.favorites.length && !this.favoriteGroups.length) return Promise.resolve(list);
		
		const slots = this.slots;
		let paths:string[] = [];
		
		if (element) {
			paths = (<FavoriteGroupTreeItem>element).group.paths;
			addItems(list, this.favorites, paths, slots, true);
		} else {
			this.favoriteGroups.forEach((favoriteGroup) => {
				
				const slot = slots.getByGroup(favoriteGroup);
				
				paths = paths.concat(favoriteGroup.paths);
				list.push(new FavoriteGroupTreeItem(favoriteGroup, slot));
				
			});
			addItems(list, this.favorites, paths, slots, false);
		}
		
		return Promise.resolve(list);
		
	}
	
}

//	Functions __________________________________________________________________

function addItems (list:FavoritesTreeItems[], favorites:Favorite[], paths:string[], slots:HotkeySlotsState, isSubProject:boolean) {
		
	const workspacePath:string = settings.getCurrentWorkspacePath();
	let hasCurrentProject = false;
	
	favorites.forEach((favorite) => {
		
		if (isSubProject && !paths.includes(favorite.path)) return;
		else if (!isSubProject && paths.includes(favorite.path)) return;
		
		const slot = slots.getByWorkspace(favorite);
		
		if (!hasCurrentProject && workspacePath && workspacePath === favorite.path) {
			hasCurrentProject = true;
			list.push(new CurrentFavoriteTreeItem(favorite, slot, isSubProject));
		} else list.push(new FavoriteTreeItem(favorite, slot, isSubProject));
		
	});
	
}