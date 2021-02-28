//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import * as dialogs from '../common/dialogs';
import * as settings from '../common/settings';
import * as states from '../common/states';

import { remove, sortCaseInsensitive } from '../@l13/arrays';
import { Favorite, FavoriteGroup } from '../@types/favorites';
import { Project, WorkspaceGroup } from '../@types/workspaces';

import { FavoriteGroupTreeItem } from '../sidebar/trees/FavoriteGroupTreeItem';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class FavoriteGroups {
	
	private static _onDidUpdateFavoriteGroup:vscode.EventEmitter<FavoriteGroup> = new vscode.EventEmitter<FavoriteGroup>();
	public static readonly onDidUpdateFavoriteGroup:vscode.Event<FavoriteGroup> = FavoriteGroups._onDidUpdateFavoriteGroup.event;
	
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
			favoriteGroups.some((group) => remove(group.paths, favorite.path));
			favoriteGroup.paths.push(favorite.path);
			favoriteGroup.paths.sort();
			states.updateFavoriteGroups(context, favoriteGroups);
			FavoriteGroups._onDidChangeFavoriteGroups.fire();
			FavoriteGroups._onDidUpdateFavoriteGroup.fire(favoriteGroup);
		}
		
	}
	
	public static async addWorkspaceGroupToFavorites (context:vscode.ExtensionContext, workspaceGroup:WorkspaceGroup, workspaces:Project[]) {
		
		const favoriteGroups = states.getFavoriteGroups(context);
		const label = workspaceGroup.label;
		
		for (const favoriteGroup of favoriteGroups) {
			if (favoriteGroup.label === label) {
				if (favoriteGroup.id === workspaceGroup.id) return;
				const BUTTON_REPLACE = 'Replace';
				const value = await vscode.window.showInformationMessage(`Replace favorite group "${label}"?`, 'Cancel', BUTTON_REPLACE);
				if (value !== BUTTON_REPLACE) return;
				remove(favoriteGroups, favoriteGroup);
				break;
			}
		}
		
		const paths = workspaceGroup.paths;
		const link = settings.get('linkFavoriteAndWorkspaceGroups', true);
		
		for (const favoriteGroup of favoriteGroups) {
			for (const path of paths) remove(favoriteGroup.paths, path);
		}
		
		favoriteGroups.push({
			label,
			id: link ? workspaceGroup.id : states.getNextGroupId(context),
			collapsed: false,
			paths: workspaceGroup.paths
		});
		
		favoriteGroups.sort(({ label:a }, { label:b }) => sortCaseInsensitive(a, b));
		
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
		states.updateFavoriteGroups(context, favoriteGroups);
		FavoriteGroups._onDidChangeFavoriteGroups.fire();
		
	}
	
	public static async updateFavoriteGroup (context:vscode.ExtensionContext, workspaceGroup:FavoriteGroup) {
		
		const favoriteGroups = states.getFavoriteGroups(context);
		
		for (const favoriteGroup of favoriteGroups) {
			if (favoriteGroup.id === workspaceGroup.id) {
				favoriteGroup.label = workspaceGroup.label;
				favoriteGroup.paths = workspaceGroup.paths;
				favoriteGroups.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
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
		const value = await dialogs.confirm(`Delete favorite group "${favoriteGroup.label}"?`, 'Delete', BUTTON_DELETE_GROUP_AND_FAVORITES);
		
		if (value) {
			const favoriteGroups = states.getFavoriteGroups(context);
			const groupId = favoriteGroup.id;
			
			for (let i = 0; i < favoriteGroups.length; i++) {
				if (favoriteGroups[i].id === groupId) {
					favoriteGroups.splice(i, 1);
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
	
	public static saveCollapseState (context:vscode.ExtensionContext, item:FavoriteGroupTreeItem, state:boolean) {
		
		const favoriteGroups = states.getFavoriteGroups(context);
		const groupId = item.favoriteGroup.id;
		
		favoriteGroups.some((favoriteGroup) => favoriteGroup.id === groupId ? (favoriteGroup.collapsed = state) || true : false);
		
		states.updateFavoriteGroups(context, favoriteGroups);
		FavoriteGroups._onDidChangeFavoriteGroups.fire();
		
	}
	
}

//	Functions __________________________________________________________________

