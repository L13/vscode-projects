//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { getFolderPath, getWorkspacePath, openTerminalWithFolder, showFileInExplorer, showFileInFinder, showFileInFolder } from './services/common';
import { ProjectsFavoritesProvider } from './services/ProjectsFavorites';
import { ProjectsProvider } from './services/ProjectsProvider';
import { ProjectsStatus } from './services/ProjectsStatus';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function activate (context:vscode.ExtensionContext) {
	
	const projectsProvider = ProjectsProvider.createProvider(context);
	const favoritesProvider = ProjectsFavoritesProvider.createProvider(context);
	const status = ProjectsStatus.createStatusBar(context);
	
	vscode.window.registerTreeDataProvider('l13ProjectsFavorites', favoritesProvider);
	vscode.window.registerTreeDataProvider('l13ProjectsWorkspaces', projectsProvider);
	
	favoritesProvider.onDidChangeTreeData(() => status.update());
	projectsProvider.onDidChangeTreeData(() => status.update());
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.pickFavorite', () => {
		
		ProjectsFavoritesProvider.pickFavorite(context);
		
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.addToFavorites', ({ project }) => {
		
		ProjectsFavoritesProvider.addToFavorites(context, project);
		
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.addToWorkspace', ({ project }) => {
		
		ProjectsProvider.addToWorkspace(project);
		
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.renameFavorite', ({ project }) => {
		
		ProjectsFavoritesProvider.renameFavorite(context, project);
		
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.removeFavorite', ({ project }) => {
		
		ProjectsFavoritesProvider.removeFavorite(context, project);
		
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.clearFavorites', () => ProjectsFavoritesProvider.clearFavorites(context)));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.openProject', ({ project }) => {
		
		const newWindow = vscode.workspace.getConfiguration('l13Projects').get('openInNewWindow', false);
		
		vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(project.path), newWindow);
		
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.openProjectInCurrentWindow', ({ project }) => {
		
		vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(project.path), false);
		
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.openProjectInNewWindow', ({ project }) => {
		
		vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(project.path), true);
		
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.pickProject', () => {
		
		ProjectsProvider.pickProject(context);
		
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.addProject', () => {
		
		ProjectsProvider.addProject(context);
		
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.saveProject', () => {
	
		ProjectsProvider.saveProject(context);
		
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.saveDetectedProject', ({ project }) => {
	
		ProjectsProvider.saveProject(context, project);
		
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.refreshProjects', () => {
		
		ProjectsProvider.createProvider(context).refreshProjects();
		
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.renameProject', ({ project }) => {
		
		ProjectsProvider.renameProject(context, project);
		
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.removeProject', ({ project }) => {
		
		ProjectsProvider.removeProject(context, project);
		
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.clearProjects', () => {
		
		ProjectsProvider.clearProjects(context);
		
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.openInNewWindow', (uri) => {
		
		vscode.commands.executeCommand('vscode.openFolder', uri, true);
		
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.openInCurrentWindow', (uri) => {
		
		vscode.commands.executeCommand('vscode.openFolder', uri, false);
		
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.showProjectInFinder', (item) => {
		
		showFileInFinder(item ? item.project.path : getWorkspacePath());
		
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.showProjectInExplorer', (item) => {
		
		showFileInExplorer(item ? item.project.path : getWorkspacePath());
		
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.showProjectInFolder', (item) => {
		
		showFileInFolder(item ? item.project.path : getWorkspacePath());
		
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.openInTerminal', ({ project }) => {
		
		openTerminalWithFolder(project);
		
	}));
	
}

export function deactivate () {
	
	//
	
}

//	Functions __________________________________________________________________

