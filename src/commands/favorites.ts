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
		'l13Projects.pickFavorite': () => FavoritesProvider.pickFavorite(context),
		'l13Projects.addToFavorites': ({ project }) => FavoritesProvider.addToFavorites(context, project),
		'l13Projects.renameFavorite': ({ project }) => FavoritesProvider.renameFavorite(context, project),
		'l13Projects.removeFavorite': ({ project }) => FavoritesProvider.removeFavorite(context, project),
		'l13Projects.clearFavorites': () => FavoritesProvider.clearFavorites(context),
	});
	
}

//	Functions __________________________________________________________________

