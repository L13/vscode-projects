//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { FavoritesProvider } from '../services/FavoritesProvider';
import { ProjectsStatus } from '../services/ProjectsStatus';
import { GroupSimpleTreeItem } from '../services/trees/GroupSimpleTreeItem';
import { GroupTypeTreeItem } from '../services/trees/GroupTypeTreeItem';
import { WorkspacesProvider } from '../services/WorkspacesProvider';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function activate (context:vscode.ExtensionContext, status:ProjectsStatus) {
	
	const workspacesProvider = WorkspacesProvider.createProvider(context);
	const treeView = vscode.window.createTreeView('l13ProjectsWorkspaces', {
		treeDataProvider: workspacesProvider
	});
	
	treeView.onDidCollapseElement(({ element }) => WorkspacesProvider.saveCollapseState(context, <GroupSimpleTreeItem|GroupTypeTreeItem>element, true));
	
	treeView.onDidExpandElement(({ element }) => WorkspacesProvider.saveCollapseState(context, <GroupSimpleTreeItem|GroupTypeTreeItem>element, false));
	
	context.subscriptions.push(treeView);
	
	workspacesProvider.onDidChangeTreeData(() => status.update());
	
	WorkspacesProvider.onDidChangeProject((project) => FavoritesProvider.updateFavorite(context, project));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.collapseAll', () => {
		
		WorkspacesProvider.currentProvider?.collapseAll();
		
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.addToWorkspace', ({ project }) => {
		
		WorkspacesProvider.addToWorkspace(project);
		
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
		
		WorkspacesProvider.pickProject(context);
		
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.addProject', () => {
		
		WorkspacesProvider.addProject(context);
		
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.saveProject', () => {
		
		WorkspacesProvider.saveProject(context);
		
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.saveDetectedProject', ({ project }) => {
		
		WorkspacesProvider.saveProject(context, project);
		
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.refreshProjects', () => {
		
		WorkspacesProvider.createProvider(context).refreshProjects();
		
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.renameProject', ({ project }) => {
		
		WorkspacesProvider.renameProject(context, project);
		
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.removeProject', ({ project }) => {
		
		WorkspacesProvider.removeProject(context, project);
		
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.clearProjects', () => {
		
		WorkspacesProvider.clearProjects(context);
		
	}));
	
}

//	Functions __________________________________________________________________

