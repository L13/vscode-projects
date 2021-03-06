//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { FavoriteTreeItems } from '../@types/favorites';

import * as commands from '../common/commands';

import { FavoriteGroupsDialog } from '../dialogs/FavoriteGroupsDialog';
import { FavoritesDialog } from '../dialogs/FavoritesDialog';

import { FavoritesProvider } from '../sidebar/FavoritesProvider';
import { FavoriteGroupTreeItem } from '../sidebar/trees/FavoriteGroupTreeItem';

import { FavoriteGroupsState } from '../states/FavoriteGroupsState';
import { FavoritesState } from '../states/FavoritesState';
import { HotkeySlotsState } from '../states/HotkeySlotsState';
import { ProjectsState } from '../states/ProjectsState';
import { WorkspaceGroupsState } from '../states/WorkspaceGroupsState';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function activate (context:vscode.ExtensionContext) {
	
	const subscriptions = context.subscriptions;
	
	const hotkeySlotsState = HotkeySlotsState.create(context);
	
	const favoritesState = FavoritesState.create(context);
	const favoriteGroupsState = FavoriteGroupsState.create(context);
	const favoritesDialog = FavoritesDialog.create(favoritesState, favoriteGroupsState);
	const favoriteGroupsDialog = FavoriteGroupsDialog.create(favoriteGroupsState);
	const favoritesProvider = FavoritesProvider.create({
		favorites: favoritesState.get(),
		favoriteGroups: favoriteGroupsState.get(),
		hotkeySlots: hotkeySlotsState,
	});
	
	const projectsState = ProjectsState.create(context);
	
	const workspaceGroupState = WorkspaceGroupsState.create(context);
	
	const treeView = vscode.window.createTreeView('l13ProjectsFavorites', {
		treeDataProvider: favoritesProvider,
		showCollapseAll: true,
	});
	
//	Tree View
	
	subscriptions.push(treeView);
	
	subscriptions.push(treeView.onDidCollapseElement(({ element }) => {
		
		favoriteGroupsState.saveCollapsedState((<FavoriteGroupTreeItem>element), true);
		
	}));
	
	subscriptions.push(treeView.onDidExpandElement(({ element }) => {
		
		favoriteGroupsState.saveCollapsedState((<FavoriteGroupTreeItem>element), false);
		
	}));
	
//	Favorites
	
	subscriptions.push(favoritesState.onDidUpdateFavorite((favorite) => {
		
		hotkeySlotsState.updateWorkspace(favorite);
		projectsState.update(favorite); // updates also status bar info
		
	}));
	
	subscriptions.push(favoritesState.onDidDeleteFavorite((favorite) => {
		
		favoriteGroupsState.removeFavorite(favorite);
		
	}));
	
	subscriptions.push(favoritesState.onDidChangeFavorites((favorites) => {
		
		favoritesProvider.refresh({ favorites });
		
	}));
	
//	Favorite Groups
	
	subscriptions.push(favoriteGroupsState.onDidUpdateFavoriteGroup((favoriteGroup) => {
		
		hotkeySlotsState.updateGroup(favoriteGroup);
		workspaceGroupState.update(favoriteGroup);
		
	}));
	
	subscriptions.push(favoriteGroupsState.onDidDeleteFavoriteGroup((favoriteGroup) => {
		
		if (!workspaceGroupState.getById(favoriteGroup.id)) {
			hotkeySlotsState.removeGroup(favoriteGroup);
		}
		
	}));
	
	subscriptions.push(favoriteGroupsState.onDidChangeFavoriteGroups((favoriteGroups) => {
		
		favoritesProvider.refresh({
			favorites: favoritesState.get(),
			favoriteGroups
		});
		
	}));
	
//	Commands
	
	commands.register(context, {
		'l13Projects.action.favorite.addToGroup': ({ project }:FavoriteTreeItems) => favoriteGroupsDialog.addFavoriteToGroup(project),
		'l13Projects.action.favorite.removeFromGroup': ({ project }:FavoriteTreeItems) => favoriteGroupsState.removeFavorite(project),
		'l13Projects.action.favorite.rename': ({ project }:FavoriteTreeItems) => favoritesDialog.rename(project),
		'l13Projects.action.favorite.remove': ({ project }:FavoriteTreeItems) => favoritesDialog.remove(project),
		
		'l13Projects.action.favoriteGroups.add': () => favoriteGroupsDialog.add(),
		'l13Projects.action.favoriteGroups.rename': ({ group }:FavoriteGroupTreeItem) => favoriteGroupsDialog.rename(group),
		'l13Projects.action.favoriteGroups.remove': ({ group }:FavoriteGroupTreeItem) => favoriteGroupsDialog.remove(group),
		
		'l13Projects.action.favorites.pickFavorite': () => favoritesDialog.pick(),
		'l13Projects.action.favorites.clear': () => favoritesDialog.clear(),
	});
	
}

//	Functions __________________________________________________________________

