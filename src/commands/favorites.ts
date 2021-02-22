//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import * as commands from '../common/commands';
import * as files from '../common/files';

import { HotkeySlots } from '../features/HotkeySlots';
import { FavoritesProvider } from '../sidebar/FavoritesProvider';
import { FavoriteGroupTreeItem } from '../sidebar/trees/FavoriteGroupTreeItem';
import { WorkspacesProvider } from '../sidebar/WorkspacesProvider';
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
	
	treeView.onDidCollapseElement(({ element }) => FavoritesProvider.saveCollapseState(context, <FavoriteGroupTreeItem>element, true));
	
	treeView.onDidExpandElement(({ element }) => FavoritesProvider.saveCollapseState(context, <FavoriteGroupTreeItem>element, false));
	
	favoritesProvider.onDidChangeTreeData(() => StatusBar.current?.update());
	
	FavoritesProvider.onDidChangeFavorite((favorite) => {
		
		WorkspacesProvider.updateProject(context, favorite);
		HotkeySlots.create(context).update(favorite);
		
	});
	
	commands.register(context, {
		'l13Projects.action.workspaces.addToFavorites': ({ project }) => FavoritesProvider.addToFavorites(context, project),
		
		'l13Projects.action.favorite.pick': () => FavoritesProvider.pickFavorite(context),
		'l13Projects.action.favorite.addToGroup': ({ project }) => FavoritesProvider.addToFavoriteGroup(context, project),
		'l13Projects.action.favorite.removeFromGroup': ({ project }) => FavoritesProvider.removeFromFavoriteGroup(context, project),
		'l13Projects.action.favorite.rename': ({ project }) => FavoritesProvider.renameFavorite(context, project),
		'l13Projects.action.favorite.remove': ({ project }) => FavoritesProvider.removeFavorite(context, project),
		
		'l13Projects.action.favorites.clear': () => FavoritesProvider.clearFavorites(context),
		
		'l13Projects.action.favorites.group.add': () => FavoritesProvider.addFavoriteGroup(context),
		'l13Projects.action.favorites.group.openAll': ({ favoriteGroup }) => {
			
			const favorites = FavoritesProvider.getFavoritesByGroup(context, favoriteGroup);
			
			favorites.forEach((favorite) => files.open(favorite.path, true));
			
		},
		'l13Projects.action.favorites.group.rename': ({ favoriteGroup }) => FavoritesProvider.renameFavoriteGroup(context, favoriteGroup),
		'l13Projects.action.favorites.group.remove': ({ favoriteGroup }) => FavoritesProvider.removeFavoriteGroup(context, favoriteGroup),
	});
	
}

//	Functions __________________________________________________________________

