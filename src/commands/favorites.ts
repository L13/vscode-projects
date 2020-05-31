//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { FavoritesProvider } from '../services/FavoritesProvider';
import { ProjectsProvider } from '../services/ProjectsProvider';
import { ProjectsStatus } from '../services/ProjectsStatus';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function activate (context:vscode.ExtensionContext, status:ProjectsStatus) {
	
	const favoritesProvider = FavoritesProvider.createProvider(context);
	
	vscode.window.registerTreeDataProvider('l13ProjectsFavorites', favoritesProvider);
	
	favoritesProvider.onDidChangeTreeData(() => status.update());
	
	FavoritesProvider.onDidChangeFavorite((favorite) => ProjectsProvider.updateProject(context, favorite));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.pickFavorite', () => {
		
		FavoritesProvider.pickFavorite(context);
		
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.addToFavorites', ({ project }) => {
		
		FavoritesProvider.addToFavorites(context, project);
		
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.renameFavorite', ({ project }) => {
		
		FavoritesProvider.renameFavorite(context, project);
		
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.removeFavorite', ({ project }) => {
		
		FavoritesProvider.removeFavorite(context, project);
		
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.clearFavorites', () => {
		
		FavoritesProvider.clearFavorites(context);
		
	}));
	
}

//	Functions __________________________________________________________________

