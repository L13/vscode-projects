//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { FavoritesProvider } from '../services/FavoritesProvider';
import { ProjectsProvider } from '../services/ProjectsProvider';
import { ProjectsStatus } from '../services/ProjectsStatus';
import { GroupSimpleTreeItem } from '../services/trees/GroupSimpleTreeItem';
import { GroupTypeTreeItem } from '../services/trees/GroupTypeTreeItem';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function activate (context:vscode.ExtensionContext, status:ProjectsStatus) {
	
	const projectsProvider = ProjectsProvider.createProvider(context);
	const treeView = vscode.window.createTreeView('l13ProjectsWorkspaces', {
		treeDataProvider: projectsProvider
	});
	
	treeView.onDidCollapseElement(({ element }) => ProjectsProvider.saveCollapseState(context, <GroupSimpleTreeItem|GroupTypeTreeItem>element, true));
	
	treeView.onDidExpandElement(({ element }) => ProjectsProvider.saveCollapseState(context, <GroupSimpleTreeItem|GroupTypeTreeItem>element, false));
	
	context.subscriptions.push(treeView);
	
	projectsProvider.onDidChangeTreeData(() => status.update());
	
	ProjectsProvider.onDidChangeProject((project) => FavoritesProvider.updateFavorite(context, project));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.collapseAll', () => {
		
		ProjectsProvider.currentProvider?.collapseAll();
		
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.addToWorkspace', ({ project }) => {
		
		ProjectsProvider.addToWorkspace(project);
		
	}));
	
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
	
}

//	Functions __________________________________________________________________

