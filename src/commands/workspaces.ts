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
			workspacesProvider.refresh();
		}
		
	});
	
	workspacesProvider.onDidChangeTreeData(() => StatusBar.current?.update());
	
	WorkspacesProvider.onDidChangeProject((project) => {
		
		FavoritesProvider.updateFavorite(context, project);
		HotkeySlots.create(context).update(project);
		
	});
	
	context.subscriptions.push(treeView);
	
	commands.register(context, {
		'l13Projects.action.workspace.addToWorkspace': ({ project }) => WorkspacesProvider.addToWorkspace(project),
		
		'l13Projects.action.workspace.open': ({ project }) => files.open(project.path),
		'l13Projects.action.workspace.openInCurrentWindow': ({ project }) => files.open(project.path, false),
		'l13Projects.action.workspace.openInNewWindow': ({ project }) => files.open(project.path, true),
		'l13Projects.action.workspace.pick': () => WorkspacesProvider.pickProject(context),
		'l13Projects.action.workspaces.addProject': () => WorkspacesProvider.addProject(context),
		'l13Projects.action.workspaces.addProjectWorkspace': () => WorkspacesProvider.addProjectWorkspace(context),
		'l13Projects.action.workspaces.saveProject': () => WorkspacesProvider.saveProject(context),
		'l13Projects.action.workspaces.saveDetectedProject': ({ project }) => WorkspacesProvider.saveProject(context, project),
		'l13Projects.action.workspaces.refresh': () => WorkspacesProvider.createProvider(context).refreshWorkspaces(),
		'l13Projects.action.project.rename': ({ project }) => WorkspacesProvider.renameProject(context, project),
		'l13Projects.action.project.remove': ({ project }) => WorkspacesProvider.removeProject(context, project),
		'l13Projects.action.projects.clear': () => WorkspacesProvider.clearProjects(context),
		
		'l13Projects.action.project.selectColor': ({ project }) => {
			
			workspacesProvider.showColorPicker(project);
			treeView.reveal(WorkspacesProvider.colorPicker, { focus: true, select: true });
			
		},
		'l13Projects.action.project.pickColor1': ({ project }) => workspacesProvider.assignColor(project, 1),
		'l13Projects.action.project.pickColor2': ({ project }) => workspacesProvider.assignColor(project, 2),
		'l13Projects.action.project.pickColor3': ({ project }) => workspacesProvider.assignColor(project, 3),
		'l13Projects.action.project.pickColor4': ({ project }) => workspacesProvider.assignColor(project, 4),
		'l13Projects.action.project.pickColor5': ({ project }) => workspacesProvider.assignColor(project, 5),
		'l13Projects.action.project.pickColor6': ({ project }) => workspacesProvider.assignColor(project, 6),
		'l13Projects.action.project.pickColor7': ({ project }) => workspacesProvider.assignColor(project, 7),
		'l13Projects.action.project.removeColor': ({ project }) => workspacesProvider.assignColor(project, 0),
		'l13Projects.action.project.hideColorPicker': () => workspacesProvider.hideColorPicker(),
	});
	
}

//	Functions __________________________________________________________________

