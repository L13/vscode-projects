//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { Open } from '../services/actions/Open';
import { Commands } from '../services/common/Commands';
import { Hotkeys } from '../services/common/Hotkeys';
import { StatusBar } from '../services/common/StatusBar';
import { FavoritesProvider } from '../services/sidebar/FavoritesProvider';
import { WorkspacesProvider } from '../services/sidebar/WorkspacesProvider';
import { GroupTreeItem } from '../services/types';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function activate (context:vscode.ExtensionContext, status:StatusBar) {
	
	const workspacesProvider = WorkspacesProvider.createProvider(context);
	const treeView = vscode.window.createTreeView('l13ProjectsWorkspaces', {
		treeDataProvider: workspacesProvider
	});
	
	treeView.onDidCollapseElement(({ element }) => WorkspacesProvider.saveCollapseState(context, <GroupTreeItem>element, true));
	
	treeView.onDidExpandElement(({ element }) => WorkspacesProvider.saveCollapseState(context, <GroupTreeItem>element, false));
	
	context.subscriptions.push(treeView);
	
	workspacesProvider.onDidChangeTreeData(() => status.update());
	
	WorkspacesProvider.onDidChangeProject((project) => {
		
		FavoritesProvider.updateFavorite(context, project);
		Hotkeys.updateSlot(context, project);
		
	});
	
	Commands.register(context, {
		'l13Projects.collapseAll': () => WorkspacesProvider.currentProvider?.collapseAll(),
		'l13Projects.addToWorkspace': ({ project }) => WorkspacesProvider.addToWorkspace(project),
		'l13Projects.openProject': ({ project }) => Open.openFolder(project.path),
		'l13Projects.openProjectInCurrentWindow': ({ project }) => Open.openFolder(project.path, false),
		'l13Projects.openProjectInNewWindow': ({ project }) => Open.openFolder(project.path, true),
		'l13Projects.pickProject': () => WorkspacesProvider.pickProject(context),
		'l13Projects.addProject': () => WorkspacesProvider.addProject(context),
		'l13Projects.saveProject': () => WorkspacesProvider.saveProject(context),
		'l13Projects.saveDetectedProject': ({ project }) => WorkspacesProvider.saveProject(context, project),
		'l13Projects.refreshProjects': () => WorkspacesProvider.createProvider(context).refreshProjects(),
		'l13Projects.renameProject': ({ project }) => WorkspacesProvider.renameProject(context, project),
		'l13Projects.removeProject': ({ project }) => WorkspacesProvider.removeProject(context, project),
		'l13Projects.clearProjects': () => WorkspacesProvider.clearProjects(context),
	});
	
}

//	Functions __________________________________________________________________

