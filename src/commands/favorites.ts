//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { FavoriteTreeItems } from '../@types/favorites';

import * as commands from '../common/commands';

import { FavoritesProvider } from '../sidebar/FavoritesProvider';
import { FavoriteGroupTreeItem } from '../sidebar/trees/FavoriteGroupTreeItem';

import { FavoriteGroupsState } from '../states/FavoriteGroupsState';
import { FavoritesState } from '../states/FavoritesState';
import { HotkeySlotsState } from '../states/HotkeySlotsState';
import { ProjectsState } from '../states/ProjectsState';
import { WorkspaceGroupsState } from '../states/WorkspaceGroupsState';

import { StatusBar } from '../statusbar/StatusBar';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function activate (context:vscode.ExtensionContext) {
	
	const hotkeySlotsState = HotkeySlotsState.createHotkeySlotsState(context);
	
	const favoritesState = FavoritesState.createFavoritesState(context);
	const favoriteGroupsState = FavoriteGroupsState.createFavoriteGroupsState(context);
	const favoritesProvider = FavoritesProvider.createProvider({
		favorites: favoritesState,
		favoriteGroups: favoriteGroupsState,
		hotkeySlots: hotkeySlotsState,
	});
	const treeView = vscode.window.createTreeView('l13ProjectsFavorites', {
		treeDataProvider: favoritesProvider,
		showCollapseAll: true,
	});
	
	const workspacesState = ProjectsState.createProjectsState(context);
	const workspaceGroupState = WorkspaceGroupsState.createWorkspaceGroupsState(context);
	
	treeView.onDidCollapseElement(({ element }) => {
		
		favoriteGroupsState.saveFavoriteGroupState((<FavoriteGroupTreeItem>element), true);
		
	});
	
	treeView.onDidExpandElement(({ element }) => {
		
		favoriteGroupsState.saveFavoriteGroupState((<FavoriteGroupTreeItem>element), false);
		
	});
	
	favoritesProvider.onDidChangeTreeData(() => StatusBar.current?.update());
	
	favoritesState.onDidUpdateFavorite((favorite) => {
		
		workspacesState.updateProject(favorite);
		hotkeySlotsState.update(favorite);
		
	});
	
	favoritesState.onDidDeleteFavorite((favorite) => {
		
		favoriteGroupsState.removeFromFavoriteGroup(favorite);
		
	});
	
	favoriteGroupsState.onDidUpdateFavoriteGroup((favoriteGroup) => {
		
		workspaceGroupState.updateWorkspaceGroup(favoriteGroup);
		hotkeySlotsState.updateGroup(favoriteGroup);
		
	});
	
	favoriteGroupsState.onDidDeleteFavoriteGroup((favoriteGroup) => {
		
		if (!workspaceGroupState.getWorkspaceGroupById(favoriteGroup.id)) {
			hotkeySlotsState.removeGroup(favoriteGroup);
		}
		
	});
	
	favoritesState.onDidChangeFavorites((favorites) => favoritesProvider.refresh({ favorites }));
	favoriteGroupsState.onDidChangeFavoriteGroups((favoriteGroups) => {
		
		favoritesProvider.refresh({
			favorites: favoritesState.getFavorites(),
			favoriteGroups
		});
		
	});
	
	commands.register(context, {
		'l13Projects.action.favorite.addToGroup': ({ project }:FavoriteTreeItems) => favoriteGroupsState.addFavoriteToGroup(project),
		'l13Projects.action.favorite.removeFromGroup': ({ project }:FavoriteTreeItems) => favoriteGroupsState.removeFromFavoriteGroup(project),
		'l13Projects.action.favorite.rename': ({ project }:FavoriteTreeItems) => favoritesState.renameFavorite(project),
		'l13Projects.action.favorite.remove': ({ project }:FavoriteTreeItems) => favoritesState.removeFavorite(project),
		
		'l13Projects.action.favorites.group.add': () => favoriteGroupsState.addFavoriteGroup(),
		'l13Projects.action.favorites.group.rename': ({ group }:FavoriteGroupTreeItem) => favoriteGroupsState.renameFavoriteGroup(group),
		'l13Projects.action.favorites.group.remove': ({ group }:FavoriteGroupTreeItem) => favoriteGroupsState.removeFavoriteGroup(group),
		
		'l13Projects.action.favorites.pickFavorite': () => favoritesState.pickFavorite(),
		'l13Projects.action.favorites.clear': () => favoritesState.clearFavorites(),
	});
	
}

//	Functions __________________________________________________________________

