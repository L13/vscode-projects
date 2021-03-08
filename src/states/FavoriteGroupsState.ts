//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { remove, sortCaseInsensitive } from '../@l13/arrays';

import { Favorite, FavoriteGroup } from '../@types/favorites';
import { Project, WorkspaceGroup } from '../@types/workspaces';

import { getNextGroupId } from '../common/groups';
import * as states from '../common/states';

import { FavoriteGroupTreeItem } from '../sidebar/trees/FavoriteGroupTreeItem';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class FavoriteGroupsState {
	
	private static currentFavoriteGroupsState:FavoriteGroupsState = null;
	
	public static create (context:vscode.ExtensionContext) {
		
		return FavoriteGroupsState.currentFavoriteGroupsState || (FavoriteGroupsState.currentFavoriteGroupsState = new FavoriteGroupsState(context));
		
	}
	
	public constructor (private readonly context:vscode.ExtensionContext) {}
	
	private _onDidUpdateFavoriteGroup:vscode.EventEmitter<FavoriteGroup> = new vscode.EventEmitter<FavoriteGroup>();
	public readonly onDidUpdateFavoriteGroup:vscode.Event<FavoriteGroup> = this._onDidUpdateFavoriteGroup.event;
	
	private _onDidDeleteFavoriteGroup:vscode.EventEmitter<FavoriteGroup> = new vscode.EventEmitter<FavoriteGroup>();
	public readonly onDidDeleteFavoriteGroup:vscode.Event<FavoriteGroup> = this._onDidDeleteFavoriteGroup.event;
	
	private _onDidChangeFavoriteGroups:vscode.EventEmitter<FavoriteGroup[]> = new vscode.EventEmitter<FavoriteGroup[]>();
	public readonly onDidChangeFavoriteGroups:vscode.Event<FavoriteGroup[]> = this._onDidChangeFavoriteGroups.event;
	
	public get () {
		
		return states.getFavoriteGroups(this.context);
		
	}
	
	private save (favoriteGroups:FavoriteGroup[]) {
		
		states.updateFavoriteGroups(this.context, favoriteGroups);
		
	}
	
	public getById (groupId:number) {
		
		const favoriteGroups = this.get();
		
		return favoriteGroups.find(({ id }) => id === groupId) || null;
		
	}
	
	public getByName (groupLabel:string) {
		
		const favoriteGroups = this.get();
		
		return favoriteGroups.find(({ label }) => label === groupLabel) || null;
		
	}
	
	public add (label:string) {
		
		const favoriteGroups = this.get();
		
		for (const favoriteGroup of favoriteGroups) {
			if (favoriteGroup.label === label) return;
		}
		
		favoriteGroups.push({
			label,
			id: getNextGroupId(this.context),
			collapsed: false,
			paths: [],
		});
		
		sortFavoriteGroups(favoriteGroups);
		
		this.save(favoriteGroups);
		this._onDidChangeFavoriteGroups.fire(favoriteGroups);
		
	}
	
	public addFavorite (favorite:Favorite, favoriteGroup:FavoriteGroup) {
		
		const favoriteGroups = this.get();
		
		if (!favoriteGroup.paths.includes(favorite.path)) {
			const previousFavoriteGroup = favoriteGroups.find((group) => remove(group.paths, favorite.path));
			
			favoriteGroup.paths.push(favorite.path);
			favoriteGroup.paths.sort();
			
			this.save(favoriteGroups);
			if (previousFavoriteGroup) this._onDidUpdateFavoriteGroup.fire(previousFavoriteGroup);
			this._onDidUpdateFavoriteGroup.fire(favoriteGroup);
			this._onDidChangeFavoriteGroups.fire(favoriteGroups);
		}
		
	}
	
	public addWorkspaceGroup (workspaceGroup:WorkspaceGroup, workspaces:Project[]) {
		
		const favoriteGroups = this.get();
		const paths = workspaceGroup.paths;
		
		removePathsInFavoriteGroups(favoriteGroups, paths);
		
		favoriteGroups.push({
			label: workspaceGroup.label,
			id: workspaceGroup.id,
			collapsed: false,
			paths,
		});
		
		sortFavoriteGroups(favoriteGroups);
		
		addMissingFavorites(this.context, workspaces);
		
		this.save(favoriteGroups);
		this._onDidChangeFavoriteGroups.fire(favoriteGroups);
		
	}
	
	public update (workspaceGroup:FavoriteGroup, workspaces:Project[]) {
		
		const favoriteGroups = this.get();
		
		for (const favoriteGroup of favoriteGroups) {
			if (favoriteGroup.id === workspaceGroup.id) {
				const paths = workspaceGroup.paths;
				removePathsInFavoriteGroups(favoriteGroups, paths);
				addMissingFavorites(this.context, workspaces);
				favoriteGroup.label = workspaceGroup.label;
				favoriteGroup.paths = paths;
				sortFavoriteGroups(favoriteGroups);
				this.save(favoriteGroups);
				this._onDidChangeFavoriteGroups.fire(favoriteGroups);
				break;
			}
		}
		
	}
	
	public rename (favoriteGroup:FavoriteGroup, label:string) {
		
		const favoriteGroups = this.get();
		const groupId = favoriteGroup.id;
		
		for (const group of favoriteGroups) {
			if (group.id === groupId) {
				group.label = label;
				sortFavoriteGroups(favoriteGroups);
				this.save(favoriteGroups);
				this._onDidUpdateFavoriteGroup.fire(group);
				this._onDidChangeFavoriteGroups.fire(favoriteGroups);
				break;
			}
		}
		
	}
	
	public removeFavorite (favorite:Favorite) {
		
		const favoriteGroups = this.get();
		const favoriteGroup = favoriteGroups.find((group) => remove(group.paths, favorite.path));
		
		if (favoriteGroup) {
			this.save(favoriteGroups);
			this._onDidChangeFavoriteGroups.fire(favoriteGroups);
			this._onDidUpdateFavoriteGroup.fire(favoriteGroup);
		}
		
	}
	
	public remove (favoriteGroup:FavoriteGroup, removeAll:boolean) {
		
		const favoriteGroups = this.get();
		const groupId = favoriteGroup.id;
		
		for (let i = 0; i < favoriteGroups.length; i++) {
			if (favoriteGroups[i].id === groupId) {
				favoriteGroups.splice(i, 1);
				this._onDidDeleteFavoriteGroup.fire(favoriteGroup);
				break;
			}
		}
		
		if (removeAll) {
			const favorites = states.getFavorites(this.context);
			const paths = favoriteGroup.paths;
			
			for (let i = 0; i < favorites.length; i++) {
				if (paths.includes(favorites[i].path)) favorites.splice(i, 1);
			}
			
			states.updateFavorites(this.context, favorites);
		}
		
		this.save(favoriteGroups);
		this._onDidChangeFavoriteGroups.fire(favoriteGroups);
		
	}
	
	public saveCollapsedState (item:FavoriteGroupTreeItem, collapsed:boolean) {
		
		const favoriteGroups = this.get();
		const groupId = item.group.id;
		
		for (const favoriteGroup of favoriteGroups) {
			if (favoriteGroup.id === groupId) {
				favoriteGroup.collapsed = collapsed;
				this.save(favoriteGroups);
				break;
			}
		}
		
	}
	
}

//	Functions __________________________________________________________________

function removePathsInFavoriteGroups (favoriteGroups:FavoriteGroup[], paths:string[]) {
		
	for (const favoriteGroup of favoriteGroups) {
		for (const path of paths) remove(favoriteGroup.paths, path);
	}
	
}

function addMissingFavorites (context:vscode.ExtensionContext, workspaces:Project[]) {
	
	const favorites = states.getFavorites(context);
		
	workspaces: for (const workspace of workspaces) {
		for (const favorite of favorites) {
			if (favorite.path === workspace.path) continue workspaces;
		}
		favorites.push({
			label: workspace.label,
			path: workspace.path,
			type: workspace.type,
			color: workspace.color,
		});
	}
	
	favorites.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
	
	states.updateFavorites(context, favorites);
	
}

function sortFavoriteGroups (favoriteGroups:FavoriteGroup[]) {
	
	favoriteGroups.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
	
}