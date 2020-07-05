//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import * as commands from '../common/commands';
import * as files from '../common/files';

import { GroupTreeItem } from '../@types/groups';
import { HotkeySlots } from '../features/HotkeySlots';
import { FavoritesProvider } from '../sidebar/FavoritesProvider';
import { WorkspacesProvider } from '../sidebar/WorkspacesProvider';
import { StatusBar } from '../statusbar/StatusBar';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function activate (context:vscode.ExtensionContext) {
	
	const workspacesProvider = WorkspacesProvider.createProvider(context);
	const treeView = vscode.window.createTreeView('l13ProjectsWorkspaces', {
		treeDataProvider: workspacesProvider,
		showCollapseAll: true,
	});
	
	treeView.onDidCollapseElement(({ element }) => WorkspacesProvider.saveCollapseState(context, <GroupTreeItem>element, true));
	
	treeView.onDidExpandElement(({ element }) => WorkspacesProvider.saveCollapseState(context, <GroupTreeItem>element, false));
	
	treeView.onDidChangeSelection((event) => {
		
		if (event.selection[0] !== WorkspacesProvider.colorPicker) {
			WorkspacesProvider.colorPicker.project = null;
			WorkspacesProvider.currentProvider.refresh();
		}
		
	});
	
	workspacesProvider.onDidChangeTreeData(() => StatusBar.current?.update());
	
	WorkspacesProvider.onDidChangeProject((project) => {
		
		FavoritesProvider.updateFavorite(context, project);
		HotkeySlots.create(context).update(project);
		
	});
	
	context.subscriptions.push(treeView);
	
	commands.register(context, {
		'l13Projects.addToWorkspace': ({ project }) => WorkspacesProvider.addToWorkspace(project),
		'l13Projects.openProject': ({ project }) => files.open(project.path),
		'l13Projects.openProjectInCurrentWindow': ({ project }) => files.open(project.path, false),
		'l13Projects.openProjectInNewWindow': ({ project }) => files.open(project.path, true),
		'l13Projects.pickProject': () => WorkspacesProvider.pickProject(context),
		'l13Projects.addProject': () => WorkspacesProvider.addProject(context),
		'l13Projects.saveProject': () => WorkspacesProvider.saveProject(context),
		'l13Projects.saveDetectedProject': ({ project }) => WorkspacesProvider.saveProject(context, project),
		'l13Projects.refreshProjects': () => WorkspacesProvider.createProvider(context).refreshProjects(),
		'l13Projects.renameProject': ({ project }) => WorkspacesProvider.renameProject(context, project),
		'l13Projects.removeProject': ({ project }) => WorkspacesProvider.removeProject(context, project),
		'l13Projects.clearProjects': () => WorkspacesProvider.clearProjects(context),
		'l13Projects.pickColor1': ({ project }) => workspacesProvider.assignColor(project, 1),
		'l13Projects.pickColor2': ({ project }) => workspacesProvider.assignColor(project, 2),
		'l13Projects.pickColor3': ({ project }) => workspacesProvider.assignColor(project, 3),
		'l13Projects.pickColor4': ({ project }) => workspacesProvider.assignColor(project, 4),
		'l13Projects.pickColor5': ({ project }) => workspacesProvider.assignColor(project, 5),
		'l13Projects.pickColor6': ({ project }) => workspacesProvider.assignColor(project, 6),
		'l13Projects.removeColor': ({ project }) => workspacesProvider.assignColor(project, 0),
		'l13Projects.selectColor': ({ project }) => {
			
			workspacesProvider.showColorPicker(project);
			treeView.reveal(WorkspacesProvider.colorPicker, { focus: true, select: true });
			
		},
	});
	
}

//	Functions __________________________________________________________________

