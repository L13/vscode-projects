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

export class FavoriteGroups {
	
	private static _onDidUpdateFavoriteGroup:vscode.EventEmitter<FavoriteGroup> = new vscode.EventEmitter<FavoriteGroup>();
	public static readonly onDidUpdateFavoriteGroup:vscode.Event<FavoriteGroup> = FavoriteGroups._onDidUpdateFavoriteGroup.event;
	
	private static _onDidDeleteFavoriteGroup:vscode.EventEmitter<FavoriteGroup> = new vscode.EventEmitter<FavoriteGroup>();
	public static readonly onDidDeleteFavoriteGroup:vscode.Event<FavoriteGroup> = FavoriteGroups._onDidDeleteFavoriteGroup.event;
	
	private static _onDidChangeFavoriteGroups:vscode.EventEmitter<undefined> = new vscode.EventEmitter<undefined>();
	public static readonly onDidChangeFavoriteGroups:vscode.Event<undefined> = FavoriteGroups._onDidChangeFavoriteGroups.event;
	
	public static async addFavoriteGroup (context:vscode.ExtensionContext) {
		
		const label = await vscode.window.showInputBox({
			placeHolder: 'Please enter a name for the group.',
		});
		
		if (!label) return;
		
		const favoriteGroups = states.getFavoriteGroups(context);
		
		for (const favoriteGroup of favoriteGroups) {
			if (favoriteGroup.label === label) return vscode.window.showErrorMessage(`Favorite group "${label}" exists!`);
		}
		
		favoriteGroups.push({ label, id: states.getNextGroupId(context), collapsed: false, paths: [] });
		favoriteGroups.sort(({ label:a }, { label:b }) => sortCaseInsensitive(a, b));
		states.updateFavoriteGroups(context, favoriteGroups);
		FavoriteGroups._onDidChangeFavoriteGroups.fire();
		
	}
	
	public static async addFavoriteToGroup (context:vscode.ExtensionContext, favorite:Favorite) {
		
		const favoriteGroups = states.getFavoriteGroups(context);
		
		if (!favoriteGroups.length) await FavoriteGroups.addFavoriteGroup(context);
		
		const favoriteGroup = favoriteGroups.length > 1 ? await vscode.window.showQuickPick(favoriteGroups) : favoriteGroups[0];
		
		if (favoriteGroup && !favoriteGroup.paths.includes(favorite.path)) {
			const previousFavoriteGroup = favoriteGroups.find((group) => remove(group.paths, favorite.path));
			favoriteGroup.paths.push(favorite.path);
			favoriteGroup.paths.sort();
			states.updateFavoriteGroups(context, favoriteGroups);
			FavoriteGroups._onDidChangeFavoriteGroups.fire();
			if (previousFavoriteGroup) FavoriteGroups._onDidUpdateFavoriteGroup.fire(previousFavoriteGroup);
			FavoriteGroups._onDidUpdateFavoriteGroup.fire(favoriteGroup);
		}
		
	}
	
	public static async addWorkspaceGroupToFavorites (context:vscode.ExtensionContext, workspaceGroup:WorkspaceGroup, workspaces:Project[]) {
		
		const favoriteGroups = states.getFavoriteGroups(context);
		
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
		
		addMissingFavorites(context, workspaces);
		
		states.updateFavoriteGroups(context, favoriteGroups);
		FavoriteGroups._onDidChangeFavoriteGroups.fire();
		
	}
	
	public static async updateFavoriteGroup (context:vscode.ExtensionContext, workspaceGroup:FavoriteGroup, workspaces:Project[]) {
		
		const favoriteGroups = states.getFavoriteGroups(context);
		
		for (const favoriteGroup of favoriteGroups) {
			if (favoriteGroup.id === workspaceGroup.id) {
				const group = getFavoriteGroupByName(favoriteGroups, workspaceGroup.label);
				
				if (group && group.id !== workspaceGroup.id) {
					if (!await replaceFavoriteGroup(favoriteGroups, group)) {
						favoriteGroup.id = states.getNextGroupId(context);
					}
				} else {
					const paths = workspaceGroup.paths;
					removePathsInFavoriteGroups(favoriteGroups, paths);
					addMissingFavorites(context, workspaces);
					favoriteGroup.label = workspaceGroup.label;
					favoriteGroup.paths = paths;
					favoriteGroups.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
				}
				
				states.updateFavoriteGroups(context, favoriteGroups);
				FavoriteGroups._onDidChangeFavoriteGroups.fire();
				break;
			}
		}
		
	}
	
	public static removeFromFavoriteGroup (context:vscode.ExtensionContext, favorite:Favorite) {
		
		const favoriteGroups = states.getFavoriteGroups(context);
		const favoriteGroup = favoriteGroups.find((group) => remove(group.paths, favorite.path));
		
		if (favoriteGroup) {
			states.updateFavoriteGroups(context, favoriteGroups);
			FavoriteGroups._onDidChangeFavoriteGroups.fire();
			FavoriteGroups._onDidUpdateFavoriteGroup.fire(favoriteGroup);
		}
		
	}
	
	public static async renameFavoriteGroup (context:vscode.ExtensionContext, favoriteGroup:FavoriteGroup) {
		
		const value = await vscode.window.showInputBox({
			placeHolder: 'Please enter a new name for the group.',
			value: favoriteGroup.label,
		});
		
		if (!value || favoriteGroup.label === value) return;
		
		const favoriteGroups = states.getFavoriteGroups(context);
		const groupId = favoriteGroup.id;
		
		for (const group of favoriteGroups) {
			if (group.id === groupId) {
				group.label = value;
				favoriteGroups.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
				states.updateFavoriteGroups(context, favoriteGroups);
				FavoriteGroups._onDidChangeFavoriteGroups.fire();
				FavoriteGroups._onDidUpdateFavoriteGroup.fire(group);
				break;
			}
		}
		
	}
	
	public static async removeFavoriteGroup (context:vscode.ExtensionContext, favoriteGroup:FavoriteGroup) {
		
		const BUTTON_DELETE_GROUP_AND_FAVORITES = 'Delete Group and Favorites';
		const buttons = ['Delete'];
		
		if (favoriteGroup.paths.length) buttons.push(BUTTON_DELETE_GROUP_AND_FAVORITES);
		
		const value = await dialogs.confirm(`Delete favorite group "${favoriteGroup.label}"?`, ...buttons);
		
		if (value) {
			const favoriteGroups = states.getFavoriteGroups(context);
			const groupId = favoriteGroup.id;
			
			for (let i = 0; i < favoriteGroups.length; i++) {
				if (favoriteGroups[i].id === groupId) {
					favoriteGroups.splice(i, 1);
					FavoriteGroups._onDidDeleteFavoriteGroup.fire(favoriteGroup);
					break;
				}
			}
			
			if (value === BUTTON_DELETE_GROUP_AND_FAVORITES) {
				
				const favorites = states.getFavorites(context);
				const paths = favoriteGroup.paths;
				
				for (let i = 0; i < favorites.length; i++) {
					if (paths.includes(favorites[i].path)) favorites.splice(i, 1);
				}
				
				states.updateFavorites(context, favorites);
			}
			
			states.updateFavoriteGroups(context, favoriteGroups);
			FavoriteGroups._onDidChangeFavoriteGroups.fire();
		}
		
	}
	
	public static saveFavoriteGroupState (context:vscode.ExtensionContext, item:FavoriteGroupTreeItem, collapsed:boolean) {
		
		const favoriteGroups = states.getFavoriteGroups(context);
		const groupId = item.group.id;
		
		for (const favoriteGroup of favoriteGroups) {
			if (favoriteGroup.id === groupId) {
				favoriteGroup.collapsed = collapsed;
				states.updateFavoriteGroups(context, favoriteGroups);
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