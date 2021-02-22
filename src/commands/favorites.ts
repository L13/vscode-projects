//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import * as commands from '../common/commands';

import { HotkeySlots } from '../features/HotkeySlots';
import { FavoritesProvider } from '../sidebar/FavoritesProvider';
import { WorkspacesProvider } from '../sidebar/WorkspacesProvider';
import { StatusBar } from '../statusbar/StatusBar';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function activate (context:vscode.ExtensionContext) {
	
	const favoritesProvider = FavoritesProvider.createProvider(context);
	
	vscode.window.registerTreeDataProvider('l13ProjectsFavorites', favoritesProvider);
	
	favoritesProvider.onDidChangeTreeData(() => StatusBar.current?.update());
	
	FavoritesProvider.onDidChangeFavorite((favorite) => {
		
		WorkspacesProvider.updateProject(context, favorite);
		HotkeySlots.create(context).update(favorite);
		
	});
	
	commands.register(context, {
		'l13Projects.action.favorite.pick': () => FavoritesProvider.pickFavorite(context),
		'l13Projects.action.workspaces.addToFavorites': ({ project }) => FavoritesProvider.addToFavorites(context, project),
		'l13Projects.action.favorite.rename': ({ project }) => FavoritesProvider.renameFavorite(context, project),
		'l13Projects.action.favorite.remove': ({ project }) => FavoritesProvider.removeFavorite(context, project),
		'l13Projects.action.favorites.clear': () => FavoritesProvider.clearFavorites(context),
	});
	
}

//	Functions __________________________________________________________________

