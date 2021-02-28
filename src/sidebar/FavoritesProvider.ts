//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import * as settings from '../common/settings';
import * as states from '../common/states';

import { Favorite, FavoriteGroup, FavoritesTreeItems } from '../@types/favorites';
import { InitialState } from '../@types/groups';

import { HotkeySlots } from '../states/HotkeySlots';
import { CurrentFavoriteTreeItem } from './trees/CurrentFavoriteTreeItem';
import { FavoriteGroupTreeItem } from './trees/FavoriteGroupTreeItem';
import { FavoriteTreeItem } from './trees/FavoriteTreeItem';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class FavoritesProvider implements vscode.TreeDataProvider<FavoritesTreeItems> {
	
	private _onDidChangeTreeData:vscode.EventEmitter<FavoritesTreeItems|undefined> = new vscode.EventEmitter<FavoritesTreeItems|undefined>();
	public readonly onDidChangeTreeData:vscode.Event<FavoritesTreeItems|undefined> = this._onDidChangeTreeData.event;
	
	public favorites:Favorite[] = [];
	public favoriteGroups:FavoriteGroup[] = [];
	
	private slots:HotkeySlots = null;
	
	public static currentProvider:FavoritesProvider;
	
	public static createProvider (context:vscode.ExtensionContext) {
		
		return FavoritesProvider.currentProvider || (FavoritesProvider.currentProvider = new FavoritesProvider(context));
		
	}
	
	private constructor (private context:vscode.ExtensionContext) {
		
		this.favorites = states.getFavorites(context);
		this.favoriteGroups = states.getFavoriteGroups(context);
		this.slots = HotkeySlots.create(context);
		
		const initialState:InitialState = settings.get('initialFavoritesGroupState', 'Remember');
		
		if (initialState !== 'Remember') {
			this.favoriteGroups.forEach((favoriteGroup) => favoriteGroup.collapsed = initialState === 'Collapsed');
		}
		
	}
	
	public refresh () :void {
		
		this.favorites = states.getFavorites(this.context);
		this.favoriteGroups = states.getFavoriteGroups(this.context);
		
		this._onDidChangeTreeData.fire();
		
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
			paths = (<FavoriteGroupTreeItem>element).favoriteGroup.paths;
			addItems(list, this.favorites, paths, slots, true);
		} else {
			this.favoriteGroups.forEach((favoriteGroup) => {
				
				paths = paths.concat(favoriteGroup.paths);
				list.push(new FavoriteGroupTreeItem(favoriteGroup));
				
			});
			addItems(list, this.favorites, paths, slots, false);
		}
		
		return Promise.resolve(list);
		
	}
	
}

//	Functions __________________________________________________________________

function addItems (list:FavoritesTreeItems[], favorites:Favorite[], paths:string[], slots:HotkeySlots, isSubProject:boolean) {
		
	const workspacePath:string = settings.getCurrentWorkspacePath();
	let hasCurrentProject = false;
	
	favorites.forEach((favorite) => {
		
		if (isSubProject && !paths.includes(favorite.path)) return;
		else if (!isSubProject && paths.includes(favorite.path)) return;
		
		const slot = slots.get(favorite);
		
		if (!hasCurrentProject && workspacePath && workspacePath === favorite.path) {
			hasCurrentProject = true;
			list.push(new CurrentFavoriteTreeItem(favorite, slot, isSubProject));
		} else list.push(new FavoriteTreeItem(favorite, slot, isSubProject));
		
	});
	
}