//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { FavoriteTreeItems } from '../@types/favorites';

import * as commands from '../common/commands';

import { FavoritesProvider } from '../sidebar/FavoritesProvider';
import { FavoriteGroupTreeItem } from '../sidebar/trees/FavoriteGroupTreeItem';

import { FavoriteGroups } from '../states/FavoriteGroups';
import { Favorites } from '../states/Favorites';
import { HotkeySlots } from '../states/HotkeySlots';
import { WorkspaceGroups } from '../states/WorkspaceGroups';
import { Workspaces } from '../states/Workspaces';

import { StatusBar } from '../statusbar/StatusBar';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function activate (context:vscode.ExtensionContext) {
	
	const favoritesProvider = FavoritesProvider.createProvider(context);
	const treeView = vscode.window.createTreeView('l13ProjectsFavorites', {
		treeDataProvider: favoritesProvider,
		showCollapseAll: true,
	});
	
	treeView.onDidCollapseElement(({ element }) => {
		
		FavoriteGroups.saveFavoriteGroupState(context, (<FavoriteGroupTreeItem>element), true);
		
	});
	
	treeView.onDidExpandElement(({ element }) => {
		
		FavoriteGroups.saveFavoriteGroupState(context, (<FavoriteGroupTreeItem>element), false);
		
	});
	
	favoritesProvider.onDidChangeTreeData(() => StatusBar.current?.update());
	
	Favorites.onDidUpdateFavorite((favorite) => {
		
		Workspaces.updateProject(context, favorite);
		HotkeySlots.create(context).update(favorite);
		
	});
	
	Favorites.onDidDeleteFavorite((favorite) => {
		
		FavoriteGroups.removeFromFavoriteGroup(context, favorite);
		
	});
	
	FavoriteGroups.onDidUpdateFavoriteGroup((favoriteGroup) => {
		
		WorkspaceGroups.updateWorkspaceGroup(context, favoriteGroup);
		HotkeySlots.create(context).updateGroup(favoriteGroup);
		
	});
	
	FavoriteGroups.onDidDeleteFavoriteGroup((favoriteGroup) => {
		
		if (!WorkspaceGroups.getWorkspaceGroupById(context, favoriteGroup.id)) {
			HotkeySlots.create(context).removeGroup(favoriteGroup);
		}
		
	});
	
	Favorites.onDidChangeFavorites(() => favoritesProvider.refresh());
	FavoriteGroups.onDidChangeFavoriteGroups(() => favoritesProvider.refresh());
	
	commands.register(context, {
		'l13Projects.action.favorite.addToGroup': ({ project }:FavoriteTreeItems) => FavoriteGroups.addFavoriteToGroup(context, project),
		'l13Projects.action.favorite.removeFromGroup': ({ project }:FavoriteTreeItems) => FavoriteGroups.removeFromFavoriteGroup(context, project),
		'l13Projects.action.favorite.rename': ({ project }:FavoriteTreeItems) => Favorites.renameFavorite(context, project),
		'l13Projects.action.favorite.remove': ({ project }:FavoriteTreeItems) => Favorites.removeFavorite(context, project),
		
		'l13Projects.action.favorites.group.add': () => FavoriteGroups.addFavoriteGroup(context),
		'l13Projects.action.favorites.group.rename': ({ group }:FavoriteGroupTreeItem) => FavoriteGroups.renameFavoriteGroup(context, group),
		'l13Projects.action.favorites.group.remove': ({ group }:FavoriteGroupTreeItem) => FavoriteGroups.removeFavoriteGroup(context, group),
		
		'l13Projects.action.favorites.pickFavorite': () => Favorites.pickFavorite(context),
		'l13Projects.action.favorites.clear': () => Favorites.clearFavorites(context),
	});
	
}

//	Functions __________________________________________________________________

