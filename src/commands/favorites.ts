//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { Commands } from '../services/common/Commands';
import { Hotkeys } from '../services/common/Hotkeys';
import { StatusBar } from '../services/common/StatusBar';
import { FavoritesProvider } from '../services/sidebar/FavoritesProvider';
import { WorkspacesProvider } from '../services/sidebar/WorkspacesProvider';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function activate (context:vscode.ExtensionContext, status:StatusBar) {
	
	const favoritesProvider = FavoritesProvider.createProvider(context);
	
	vscode.window.registerTreeDataProvider('l13ProjectsFavorites', favoritesProvider);
	
	favoritesProvider.onDidChangeTreeData(() => status.update());
	
	FavoritesProvider.onDidChangeFavorite((favorite) => {
		
		WorkspacesProvider.updateProject(context, favorite);
		Hotkeys.updateSlot(context, favorite);
		
	});
	
	Commands.register(context, {
		'l13Projects.pickFavorite': () => FavoritesProvider.pickFavorite(context),
		'l13Projects.addToFavorites': ({ project }) => FavoritesProvider.addToFavorites(context, project),
		'l13Projects.renameFavorite': ({ project }) => FavoritesProvider.renameFavorite(context, project),
		'l13Projects.removeFavorite': ({ project }) => FavoritesProvider.removeFavorite(context, project),
		'l13Projects.clearFavorites': () => FavoritesProvider.clearFavorites(context),
	});
	
}

//	Functions __________________________________________________________________

