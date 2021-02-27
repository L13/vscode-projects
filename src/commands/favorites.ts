//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import * as commands from '../common/commands';
import * as files from '../common/files';
import * as settings from '../common/settings';

import { FavoriteTreeItems } from '../@types/favorites';

import { HotkeySlots } from '../features/HotkeySlots';
import { FavoritesProvider } from '../sidebar/FavoritesProvider';
import { FavoriteGroupTreeItem } from '../sidebar/trees/FavoriteGroupTreeItem';
import { GroupCustomTreeItem } from '../sidebar/trees/GroupCustomTreeItem';
import { ProjectTreeItem } from '../sidebar/trees/ProjectTreeItem';
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
	
	FavoritesProvider.onDidChangeFavoriteGroup((favoriteGroup) => {
		
		if (settings.get('linkFavoriteAndWorkspaceGroups', true)) {
			WorkspacesProvider.updateWorkspaceGroup(context, favoriteGroup);
		}
		
	});
	
	commands.register(context, {
		'l13Projects.action.workspaces.addToFavorites': ({ project }:ProjectTreeItem) => FavoritesProvider.addToFavorites(context, project),
		'l13Projects.action.workspaces.group.addToFavorites': ({ group }:GroupCustomTreeItem) => {
			
			const workspaces = group.paths.map((path) => WorkspacesProvider.currentProvider?.getWorkspaceByPath(path));
			
			FavoritesProvider.addWorkspaceGroupToFavorites(context, group, workspaces.filter((workspace) => !!workspace));
			
		},
		
		'l13Projects.action.favorite.pick': () => FavoritesProvider.pickFavorite(context),
		'l13Projects.action.favorite.addToGroup': ({ project }:FavoriteTreeItems) => FavoritesProvider.addFavoriteToGroup(context, project),
		'l13Projects.action.favorite.removeFromGroup': ({ project }:FavoriteTreeItems) => FavoritesProvider.removeFromFavoriteGroup(context, project),
		'l13Projects.action.favorite.rename': ({ project }:FavoriteTreeItems) => FavoritesProvider.renameFavorite(context, project),
		'l13Projects.action.favorite.remove': ({ project }:FavoriteTreeItems) => FavoritesProvider.removeFavorite(context, project),
		
		'l13Projects.action.favorites.group.add': () => FavoritesProvider.addFavoriteGroup(context),
		'l13Projects.action.favorites.group.openAll': ({ favoriteGroup }:FavoriteGroupTreeItem) => files.openAll(favoriteGroup.paths),
		'l13Projects.action.favorites.group.rename': ({ favoriteGroup }:FavoriteGroupTreeItem) => FavoritesProvider.renameFavoriteGroup(context, favoriteGroup),
		'l13Projects.action.favorites.group.remove': ({ favoriteGroup }:FavoriteGroupTreeItem) => FavoritesProvider.removeFavoriteGroup(context, favoriteGroup),
		
		'l13Projects.action.favorites.clear': () => FavoritesProvider.clearFavorites(context),
	});
	
}

//	Functions __________________________________________________________________

