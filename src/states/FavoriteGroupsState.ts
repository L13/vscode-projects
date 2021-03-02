//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { remove, sortCaseInsensitive } from '../@l13/arrays';

import { Favorite, FavoriteGroup } from '../@types/favorites';
import { Project, WorkspaceGroup } from '../@types/workspaces';

import * as dialogs from '../common/dialogs';
import * as states from '../common/states';

import { FavoriteGroupTreeItem } from '../sidebar/trees/FavoriteGroupTreeItem';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class FavoriteGroupsState {
	
	private static currentFavoriteGroupsState:FavoriteGroupsState = null;
	
	public static createFavoriteGroupsState (context:vscode.ExtensionContext) {
		
		return FavoriteGroupsState.currentFavoriteGroupsState || (FavoriteGroupsState.currentFavoriteGroupsState = new FavoriteGroupsState(context));
		
	}
	
	public constructor (private readonly context:vscode.ExtensionContext) {}
	
	private _onDidUpdateFavoriteGroup:vscode.EventEmitter<FavoriteGroup> = new vscode.EventEmitter<FavoriteGroup>();
	public readonly onDidUpdateFavoriteGroup:vscode.Event<FavoriteGroup> = this._onDidUpdateFavoriteGroup.event;
	
	private _onDidDeleteFavoriteGroup:vscode.EventEmitter<FavoriteGroup> = new vscode.EventEmitter<FavoriteGroup>();
	public readonly onDidDeleteFavoriteGroup:vscode.Event<FavoriteGroup> = this._onDidDeleteFavoriteGroup.event;
	
	private _onDidChangeFavoriteGroups:vscode.EventEmitter<undefined> = new vscode.EventEmitter<undefined>();
	public readonly onDidChangeFavoriteGroups:vscode.Event<undefined> = this._onDidChangeFavoriteGroups.event;
	
	public getFavoriteGroups () {
		
		return states.getFavoriteGroups(this.context);
		
	}
	
	public async addFavoriteGroup () {
		
		const label = await vscode.window.showInputBox({
			placeHolder: 'Please enter a name for the group.',
		});
		
		if (!label) return;
		
		const favoriteGroups = states.getFavoriteGroups(this.context);
		
		for (const favoriteGroup of favoriteGroups) {
			if (favoriteGroup.label === label) return vscode.window.showErrorMessage(`Favorite group "${label}" exists!`);
		}
		
		favoriteGroups.push({ label, id: states.getNextGroupId(this.context), collapsed: false, paths: [] });
		favoriteGroups.sort(({ label:a }, { label:b }) => sortCaseInsensitive(a, b));
		states.updateFavoriteGroups(this.context, favoriteGroups);
		this._onDidChangeFavoriteGroups.fire();
		
	}
	
	public async addFavoriteToGroup (favorite:Favorite) {
		
		const favoriteGroups = states.getFavoriteGroups(this.context);
		
		if (!favoriteGroups.length) await this.addFavoriteGroup();
		
		const favoriteGroup = favoriteGroups.length > 1 ? await vscode.window.showQuickPick(favoriteGroups) : favoriteGroups[0];
		
		if (favoriteGroup && !favoriteGroup.paths.includes(favorite.path)) {
			const previousFavoriteGroup = favoriteGroups.find((group) => remove(group.paths, favorite.path));
			favoriteGroup.paths.push(favorite.path);
			favoriteGroup.paths.sort();
			states.updateFavoriteGroups(this.context, favoriteGroups);
			this._onDidChangeFavoriteGroups.fire();
			if (previousFavoriteGroup) this._onDidUpdateFavoriteGroup.fire(previousFavoriteGroup);
			this._onDidUpdateFavoriteGroup.fire(favoriteGroup);
		}
		
	}
	
	public async addWorkspaceGroupToFavorites (workspaceGroup:WorkspaceGroup, workspaces:Project[]) {
		
		const favoriteGroups = states.getFavoriteGroups(this.context);
		
		for (const favoriteGroup of favoriteGroups) {
			if (favoriteGroup.id === workspaceGroup.id) return;
		}
		
		const label = workspaceGroup.label;
		
		for (const favoriteGroup of favoriteGroups) {
			if (favoriteGroup.label === label) {
				if (!await replaceFavoriteGroup(favoriteGroups, favoriteGroup)) return;
				break;
			}
		}
		
		const paths = workspaceGroup.paths;
		
		removePathsInFavoriteGroups(favoriteGroups, paths);
		
		favoriteGroups.push({
			label,
			id: workspaceGroup.id,
			collapsed: false,
			paths,
		});
		
		favoriteGroups.sort(({ label:a }, { label:b }) => sortCaseInsensitive(a, b));
		
		addMissingFavorites(this.context, workspaces);
		
		states.updateFavoriteGroups(this.context, favoriteGroups);
		this._onDidChangeFavoriteGroups.fire();
		
	}
	
	public async updateFavoriteGroup (workspaceGroup:FavoriteGroup, workspaces:Project[]) {
		
		const favoriteGroups = states.getFavoriteGroups(this.context);
		
		for (const favoriteGroup of favoriteGroups) {
			if (favoriteGroup.id === workspaceGroup.id) {
				const group = getFavoriteGroupByName(favoriteGroups, workspaceGroup.label);
				
				if (group && group.id !== workspaceGroup.id) {
					if (!await replaceFavoriteGroup(favoriteGroups, group)) {
						favoriteGroup.id = states.getNextGroupId(this.context);
					}
				} else {
					const paths = workspaceGroup.paths;
					removePathsInFavoriteGroups(favoriteGroups, paths);
					addMissingFavorites(this.context, workspaces);
					favoriteGroup.label = workspaceGroup.label;
					favoriteGroup.paths = paths;
					favoriteGroups.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
				}
				
				states.updateFavoriteGroups(this.context, favoriteGroups);
				this._onDidChangeFavoriteGroups.fire();
				break;
			}
		}
		
	}
	
	public removeFromFavoriteGroup (favorite:Favorite) {
		
		const favoriteGroups = states.getFavoriteGroups(this.context);
		const favoriteGroup = favoriteGroups.find((group) => remove(group.paths, favorite.path));
		
		if (favoriteGroup) {
			states.updateFavoriteGroups(this.context, favoriteGroups);
			this._onDidChangeFavoriteGroups.fire();
			this._onDidUpdateFavoriteGroup.fire(favoriteGroup);
		}
		
	}
	
	public async renameFavoriteGroup (favoriteGroup:FavoriteGroup) {
		
		const value = await vscode.window.showInputBox({
			placeHolder: 'Please enter a new name for the group.',
			value: favoriteGroup.label,
		});
		
		if (!value || favoriteGroup.label === value) return;
		
		const favoriteGroups = states.getFavoriteGroups(this.context);
		const groupId = favoriteGroup.id;
		
		for (const group of favoriteGroups) {
			if (group.id === groupId) {
				group.label = value;
				favoriteGroups.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
				states.updateFavoriteGroups(this.context, favoriteGroups);
				this._onDidChangeFavoriteGroups.fire();
				this._onDidUpdateFavoriteGroup.fire(group);
				break;
			}
		}
		
	}
	
	public async removeFavoriteGroup (favoriteGroup:FavoriteGroup) {
		
		const BUTTON_DELETE_GROUP_AND_FAVORITES = 'Delete Group and Favorites';
		const buttons = ['Delete'];
		
		if (favoriteGroup.paths.length) buttons.push(BUTTON_DELETE_GROUP_AND_FAVORITES);
		
		const value = await dialogs.confirm(`Delete favorite group "${favoriteGroup.label}"?`, ...buttons);
		
		if (value) {
			const favoriteGroups = states.getFavoriteGroups(this.context);
			const groupId = favoriteGroup.id;
			
			for (let i = 0; i < favoriteGroups.length; i++) {
				if (favoriteGroups[i].id === groupId) {
					favoriteGroups.splice(i, 1);
					this._onDidDeleteFavoriteGroup.fire(favoriteGroup);
					break;
				}
			}
			
			if (value === BUTTON_DELETE_GROUP_AND_FAVORITES) {
				
				const favorites = states.getFavorites(this.context);
				const paths = favoriteGroup.paths;
				
				for (let i = 0; i < favorites.length; i++) {
					if (paths.includes(favorites[i].path)) favorites.splice(i, 1);
				}
				
				states.updateFavorites(this.context, favorites);
			}
			
			states.updateFavoriteGroups(this.context, favoriteGroups);
			this._onDidChangeFavoriteGroups.fire();
		}
		
	}
	
	public saveFavoriteGroupState (item:FavoriteGroupTreeItem, collapsed:boolean) {
		
		const favoriteGroups = states.getFavoriteGroups(this.context);
		const groupId = item.group.id;
		
		for (const favoriteGroup of favoriteGroups) {
			if (favoriteGroup.id === groupId) {
				favoriteGroup.collapsed = collapsed;
				states.updateFavoriteGroups(this.context, favoriteGroups);
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

function getFavoriteGroupByName (favoriteGroups:FavoriteGroup[], label:string) {
	
	for (const favoriteGroup of favoriteGroups) {
		if (favoriteGroup.label === label) return favoriteGroup;
	}
	
	return null;
	
}

async function replaceFavoriteGroup (favoriteGroups:FavoriteGroup[], favoriteGroup:FavoriteGroup) {
	
	const BUTTON_REPLACE = 'Replace';
	const value = await vscode.window.showInformationMessage(`Replace favorite group "${favoriteGroup.label}"?`, 'Cancel', BUTTON_REPLACE);
	
	if (value !== BUTTON_REPLACE) return false;
	
	return remove(favoriteGroups, favoriteGroup);
	
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