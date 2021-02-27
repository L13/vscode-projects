//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import * as commands from '../common/commands';
import * as files from '../common/files';
import * as settings from '../common/settings';

import { GroupTreeItem } from '../@types/groups';
import { WorkspaceTreeItems } from '../@types/workspaces';

import { HotkeySlots } from '../features/HotkeySlots';
import { FavoritesProvider } from '../sidebar/FavoritesProvider';
import { GroupCustomTreeItem } from '../sidebar/trees/GroupCustomTreeItem';
import { ProjectTreeItem } from '../sidebar/trees/ProjectTreeItem';
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
	
	WorkspacesProvider.onDidChangeWorkspaceGroup((workspaceGroup) => {
		
		if (settings.get('linkFavoriteAndWorkspaceGroups', true)) {
			FavoritesProvider.updateFavoriteGroup(context, workspaceGroup);
		}
		
	});
	
	context.subscriptions.push(treeView);
	
	commands.register(context, {
		'l13Projects.action.workspace.addToWorkspace': ({ project }:WorkspaceTreeItems) => WorkspacesProvider.addToWorkspace(project),
		
		'l13Projects.action.workspace.open': ({ project }:WorkspaceTreeItems) => files.open(project.path),
		'l13Projects.action.workspace.openInCurrentWindow': ({ project }:WorkspaceTreeItems) => files.open(project.path, false),
		'l13Projects.action.workspace.openInNewWindow': ({ project }:WorkspaceTreeItems) => files.open(project.path, true),
		'l13Projects.action.workspace.pick': () => WorkspacesProvider.pickWorkspace(context),
		'l13Projects.action.workspaces.addProject': () => WorkspacesProvider.addProject(context),
		'l13Projects.action.workspaces.addProjectWorkspace': () => WorkspacesProvider.addProjectWorkspace(context),
		'l13Projects.action.workspaces.saveProject': () => WorkspacesProvider.saveProject(context),
		'l13Projects.action.workspaces.saveDetectedProject': ({ project }:WorkspaceTreeItems) => WorkspacesProvider.saveProject(context, project),
		'l13Projects.action.workspaces.refresh': () => WorkspacesProvider.createProvider(context).refreshWorkspaces(),
		
		'l13Projects.action.workspaces.group.add': () => WorkspacesProvider.addWorkspaceGroup(context),
		'l13Projects.action.workspace.addToGroup': ({ project }:WorkspaceTreeItems) => WorkspacesProvider.addWorkspaceToGroup(context, project),
		'l13Projects.action.workspace.removeFromGroup': ({ project }:WorkspaceTreeItems) => WorkspacesProvider.removeFromWorkspaceGroup(context, project),
		'l13Projects.action.workspaces.group.openAll': ({ group }:GroupCustomTreeItem) => files.openAll(group.paths),
		'l13Projects.action.workspaces.group.rename': ({ group }:GroupCustomTreeItem) => WorkspacesProvider.renameWorkspaceGroup(context, group),
		'l13Projects.action.workspaces.group.remove': ({ group }:GroupCustomTreeItem) => WorkspacesProvider.removeWorkspaceGroup(context, group),
		'l13Projects.action.workspaces.groups.clear': () => WorkspacesProvider.clearWorkspaceGroups(context),
		
		'l13Projects.action.project.rename': ({ project }:ProjectTreeItem) => WorkspacesProvider.renameProject(context, project),
		'l13Projects.action.project.remove': ({ project }:ProjectTreeItem) => WorkspacesProvider.removeProject(context, project),
		'l13Projects.action.projects.clear': () => WorkspacesProvider.clearProjects(context),
		
		'l13Projects.action.project.selectColor': ({ project }:ProjectTreeItem) => {
			
			workspacesProvider.showColorPicker(project);
			treeView.reveal(WorkspacesProvider.colorPicker, { focus: true, select: true });
			
		},
		'l13Projects.action.project.pickColor1': ({ project }:ProjectTreeItem) => workspacesProvider.assignColor(project, 1),
		'l13Projects.action.project.pickColor2': ({ project }:ProjectTreeItem) => workspacesProvider.assignColor(project, 2),
		'l13Projects.action.project.pickColor3': ({ project }:ProjectTreeItem) => workspacesProvider.assignColor(project, 3),
		'l13Projects.action.project.pickColor4': ({ project }:ProjectTreeItem) => workspacesProvider.assignColor(project, 4),
		'l13Projects.action.project.pickColor5': ({ project }:ProjectTreeItem) => workspacesProvider.assignColor(project, 5),
		'l13Projects.action.project.pickColor6': ({ project }:ProjectTreeItem) => workspacesProvider.assignColor(project, 6),
		'l13Projects.action.project.pickColor7': ({ project }:ProjectTreeItem) => workspacesProvider.assignColor(project, 7),
		'l13Projects.action.project.removeColor': ({ project }:ProjectTreeItem) => workspacesProvider.assignColor(project, 0),
		'l13Projects.action.project.hideColorPicker': () => workspacesProvider.hideColorPicker(),
	});
	
}

//	Functions __________________________________________________________________

