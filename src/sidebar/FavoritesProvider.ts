//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import type { GroupDescriptionFormat, InitialState, WorkspaceDescriptionFormat } from '../@types/common';
import type { Tag } from '../@types/tags';

import { formatGroupDescription, formatWorkspaceDescription } from '../@l13/formats';
import { Favorite, FavoriteGroup, FavoritesStates, FavoritesTreeItems, RefreshFavoritesStates } from '../@types/favorites';

import * as settings from '../common/settings';
import { getCurrentWorkspacePath } from '../common/workspaces';

import type { HotkeySlotsState } from '../states/HotkeySlotsState';

import { FavoriteGroupTreeItem } from './trees/groups/FavoriteGroupTreeItem';
import { CurrentFavoriteTreeItem } from './trees/items/CurrentFavoriteTreeItem';
import { FavoriteTreeItem } from './trees/items/FavoriteTreeItem';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class FavoritesProvider implements vscode.TreeDataProvider<FavoritesTreeItems> {
	
	private _onDidChangeTreeData: vscode.EventEmitter<FavoritesTreeItems|undefined> = new vscode.EventEmitter<FavoritesTreeItems|undefined>();
	public readonly onDidChangeTreeData: vscode.Event<FavoritesTreeItems|undefined> = this._onDidChangeTreeData.event;
	
	public workspaceDescriptionFormat: WorkspaceDescriptionFormat = settings.get('workspaceDescriptionFormat');
	public groupDescriptionFormat: GroupDescriptionFormat = settings.get('groupDescriptionFormat');
	
	private favorites: Favorite[] = [];
	private favoriteGroups: FavoriteGroup[] = [];
	private slots: HotkeySlotsState = null;
	
	private tags: Tag[] = [];
	
	public static current: FavoritesProvider;
	
	public static create (states: FavoritesStates) {
		
		return FavoritesProvider.current || (FavoritesProvider.current = new FavoritesProvider(states));
		
	}
	
	private constructor ({ favorites, favoriteGroups, hotkeySlots, tags }: FavoritesStates) {
		
		this.favorites = favorites;
		this.favoriteGroups = favoriteGroups;
		this.slots = hotkeySlots;
		this.tags = tags;
		
		const initialState: InitialState = settings.get('initialFavoriteGroupsState', 'remember');
		
		if (initialState !== 'remember') {
			this.favoriteGroups.forEach((favoriteGroup) => favoriteGroup.collapsed = initialState === 'collapsed');
		}
		
	}
	
	public refresh (refreshStates?: RefreshFavoritesStates) {
		
		if (refreshStates?.favorites) this.favorites = refreshStates.favorites;
		if (refreshStates?.favoriteGroups) this.favoriteGroups = refreshStates.favoriteGroups;
		if (refreshStates?.tags) this.tags = refreshStates.tags;
		
		this._onDidChangeTreeData.fire(undefined);
		
	}
	
	public getTreeItem (element: FavoritesTreeItems) {
		
		return element;
		
	}
	
	public getChildren (element?: FavoritesTreeItems) {
		
		const list: FavoritesTreeItems[] = [];
		
		if (!this.favorites.length && !this.favoriteGroups.length) return Promise.resolve(list);
		
		const slots = this.slots;
		let paths: string[] = [];
		
		if (element) {
			paths = (<FavoriteGroupTreeItem>element).group.paths;
			this.addItems(list, paths, true);
		} else {
			this.favoriteGroups.forEach((favoriteGroup) => {
				
				const slot = slots.getByGroup(favoriteGroup);
				const info = formatGroupDescription(favoriteGroup.paths.length, slot, this.groupDescriptionFormat);
				
				paths = paths.concat(favoriteGroup.paths);
				
				list.push(new FavoriteGroupTreeItem(favoriteGroup, info));
				
			});
			this.addItems(list, paths, false);
		}
		
		return Promise.resolve(list);
		
	}
	
	private addItems (list: FavoritesTreeItems[], paths: string[], isSubItem: boolean) {
		
		const workspacePath: string = getCurrentWorkspacePath();
		const slots = this.slots;
		const tags = this.tags;
		const workspaceDescriptionFormat = this.workspaceDescriptionFormat;
		let hasCurrentProject = false;
		
		this.favorites.forEach((favorite) => {
			
			if (isSubItem && !paths.includes(favorite.path)) return;
			else if (!isSubItem && paths.includes(favorite.path)) return;
			
			const slot = slots.getByWorkspace(favorite);
			const description = formatWorkspaceDescription(favorite, slot, tags, workspaceDescriptionFormat);
			
			if (!hasCurrentProject && workspacePath && workspacePath === favorite.path) {
				hasCurrentProject = true;
				list.push(new CurrentFavoriteTreeItem(favorite, description, isSubItem));
			} else list.push(new FavoriteTreeItem(favorite, description, isSubItem));
			
		});
		
	}
	
}

//	Functions __________________________________________________________________

