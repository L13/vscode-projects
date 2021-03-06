//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { FavoriteTreeItems } from '../@types/favorites';

import * as commands from '../common/commands';
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
	
	const hotkeySlotsState = HotkeySlotsState.createHotkeySlotsState(context);
	
	const favoritesState = FavoritesState.createFavoritesState(context);
	const favoriteGroupsState = FavoriteGroupsState.createFavoriteGroupsState(context);
	const favoritesDialog = FavoritesDialog.createFavoritesDialog(favoritesState, favoriteGroupsState);
	const favoritesProvider = FavoritesProvider.createProvider({
		favorites: favoritesState.getAll(),
		favoriteGroups: favoriteGroupsState.getFavoriteGroups(),
		hotkeySlots: hotkeySlotsState,
	});
	
	const projectsState = ProjectsState.createProjectsState(context);
	
	const workspaceGroupState = WorkspaceGroupsState.createWorkspaceGroupsState(context);
	
	const treeView = vscode.window.createTreeView('l13ProjectsFavorites', {
		treeDataProvider: favoritesProvider,
		showCollapseAll: true,
	});
	
//	Tree View
	
	subscriptions.push(treeView);
	
	subscriptions.push(treeView.onDidCollapseElement(({ element }) => {
		
		favoriteGroupsState.saveFavoriteGroupState((<FavoriteGroupTreeItem>element), true);
		
	}));
	
	subscriptions.push(treeView.onDidExpandElement(({ element }) => {
		
		favoriteGroupsState.saveFavoriteGroupState((<FavoriteGroupTreeItem>element), false);
		
	}));
	
//	Favorites
	
	subscriptions.push(favoritesState.onDidUpdateFavorite((favorite) => {
		
		hotkeySlotsState.updateWorkspace(favorite);
		projectsState.update(favorite); // updates also status bar info
		
	}));
	
	subscriptions.push(favoritesState.onDidDeleteFavorite((favorite) => {
		
		favoriteGroupsState.removeFromFavoriteGroup(favorite);
		
	}));
	
	subscriptions.push(favoritesState.onDidChangeFavorites((favorites) => {
		
		favoritesProvider.refresh({ favorites });
		
	}));
	
//	Favorite Groups
	
	subscriptions.push(favoriteGroupsState.onDidUpdateFavoriteGroup((favoriteGroup) => {
		
		hotkeySlotsState.updateGroup(favoriteGroup);
		workspaceGroupState.updateWorkspaceGroup(favoriteGroup);
		
	}));
	
	subscriptions.push(favoriteGroupsState.onDidDeleteFavoriteGroup((favoriteGroup) => {
		
		if (!workspaceGroupState.getWorkspaceGroupById(favoriteGroup.id)) {
			hotkeySlotsState.removeGroup(favoriteGroup);
		}
		
	}));
	
	subscriptions.push(favoriteGroupsState.onDidChangeFavoriteGroups((favoriteGroups) => {
		
		favoritesProvider.refresh({
			favorites: favoritesState.getAll(),
			favoriteGroups
		});
		
	}));
	
//	Commands
	
	commands.register(context, {
		'l13Projects.action.favorite.addToGroup': ({ project }:FavoriteTreeItems) => favoriteGroupsState.addFavoriteToGroup(project),
		'l13Projects.action.favorite.removeFromGroup': ({ project }:FavoriteTreeItems) => favoriteGroupsState.removeFromFavoriteGroup(project),
		'l13Projects.action.favorite.rename': ({ project }:FavoriteTreeItems) => favoritesDialog.rename(project),
		'l13Projects.action.favorite.remove': ({ project }:FavoriteTreeItems) => favoritesDialog.remove(project),
		
		'l13Projects.action.favoriteGroups.add': () => favoriteGroupsState.addFavoriteGroup(),
		'l13Projects.action.favoriteGroups.rename': ({ group }:FavoriteGroupTreeItem) => favoriteGroupsState.renameFavoriteGroup(group),
		'l13Projects.action.favoriteGroups.remove': ({ group }:FavoriteGroupTreeItem) => favoriteGroupsState.removeFavoriteGroup(group),
		
		'l13Projects.action.favorites.pickFavorite': () => favoritesDialog.pick(),
		'l13Projects.action.favorites.clear': () => favoritesDialog.clear(),
	});
	
}

//	Functions __________________________________________________________________

