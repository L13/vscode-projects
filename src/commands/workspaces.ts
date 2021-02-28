//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import * as commands from '../common/commands';
import * as files from '../common/files';

import { GroupTreeItem } from '../@types/groups';
import { WorkspaceTreeItems } from '../@types/workspaces';

import { HotkeySlots } from '../features/HotkeySlots';

import { ColorPickerTreeItem } from '../sidebar/trees/ColorPickerTreeItem';
import { GroupCustomTreeItem } from '../sidebar/trees/GroupCustomTreeItem';
import { ProjectTreeItem } from '../sidebar/trees/ProjectTreeItem';

import { FavoriteGroups } from '../states/FavoriteGroups';
import { Favorites } from '../states/Favorites';
import { StatusBartColor } from '../states/StatusBarColor';
import { WorkspaceGroups } from '../states/WorkspaceGroups';
import { Workspaces } from '../states/Workspaces';

import { WorkspacesProvider } from '../sidebar/WorkspacesProvider';

import { StatusBar } from '../statusbar/StatusBar';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function activate (context:vscode.ExtensionContext) {
	
	const colorPicker = new ColorPickerTreeItem();
	const workspacesProvider = WorkspacesProvider.createProvider(context, colorPicker);
	const treeView = vscode.window.createTreeView('l13ProjectsWorkspaces', {
		treeDataProvider: workspacesProvider,
		showCollapseAll: true,
	});
	
	treeView.onDidCollapseElement(({ element }) => WorkspacesProvider.saveCollapseState(context, <GroupTreeItem>element, true));
	
	treeView.onDidExpandElement(({ element }) => WorkspacesProvider.saveCollapseState(context, <GroupTreeItem>element, false));
	
	treeView.onDidChangeSelection((event) => {
		
		if (event.selection[0] !== colorPicker) {
			colorPicker.project = null;
			workspacesProvider.refresh();
		}
		
	});
	
	workspacesProvider.onDidChangeTreeData(() => StatusBar.current?.update());
	
	Workspaces.onDidUpdateProject((project) => {
		
		if (project.removed) project = workspacesProvider.getWorkspaceByPath(project.path) || project;
		
		Favorites.updateFavorite(context, project);
		HotkeySlots.create(context).update(project);
		
	});
	
	WorkspaceGroups.onDidUpdateWorkspaceGroup((workspaceGroup) => {
		
		FavoriteGroups.updateFavoriteGroup(context, workspaceGroup);
		
	});
	
	StatusBartColor.onDidUpdateColor((project) => {
		
		Favorites.updateFavorite(context, project);
		
	});
	
	Workspaces.onDidChangeWorkspaces(() => workspacesProvider.refresh());
	WorkspaceGroups.onDidChangeWorkspaceGroups(() => workspacesProvider.refresh());
	StatusBartColor.onDidChangeColor(() => workspacesProvider.refresh());
	
	context.subscriptions.push(treeView);
	
	commands.register(context, {
		
		'l13Projects.action.workspace.open': ({ project }:WorkspaceTreeItems) => files.open(project.path),
		'l13Projects.action.workspace.openInCurrentWindow': ({ project }:WorkspaceTreeItems) => files.open(project.path, false),
		'l13Projects.action.workspace.openInNewWindow': ({ project }:WorkspaceTreeItems) => files.open(project.path, true),
		
		'l13Projects.action.workspace.addToWorkspace': ({ project }:WorkspaceTreeItems) => WorkspacesProvider.addToWorkspace(project),
		'l13Projects.action.workspace.addToFavorites': ({ project }:ProjectTreeItem) => Favorites.addToFavorites(context, project),
		'l13Projects.action.workspace.addToGroup': ({ project }:WorkspaceTreeItems) => WorkspaceGroups.addWorkspaceToGroup(context, project),
		'l13Projects.action.workspace.removeFromGroup': ({ project }:WorkspaceTreeItems) => WorkspaceGroups.removeFromWorkspaceGroup(context, project),
		
		'l13Projects.action.workspaces.addProject': () => Workspaces.addProject(context),
		'l13Projects.action.workspaces.addProjectWorkspace': () => Workspaces.addProjectWorkspace(context),
		'l13Projects.action.workspaces.saveProject': () => Workspaces.saveProject(context),
		'l13Projects.action.workspaces.saveDetectedProject': ({ project }:WorkspaceTreeItems) => Workspaces.saveProject(context, project),
		'l13Projects.action.workspaces.pickWorkspace': async () => Workspaces.pickWorkspace(await workspacesProvider.createQuickPickItems()),
		'l13Projects.action.workspaces.refresh': () => WorkspacesProvider.createProvider(context, colorPicker).refreshWorkspaces(),
		
		'l13Projects.action.workspaces.group.add': () => WorkspaceGroups.addWorkspaceGroup(context),
		'l13Projects.action.workspaces.group.addToFavorites': ({ group }:GroupCustomTreeItem) => {
			
			const workspaces = group.paths.map((path) => workspacesProvider.getWorkspaceByPath(path));
			
			FavoriteGroups.addWorkspaceGroupToFavorites(context, group, workspaces.filter((workspace) => !!workspace));
			
		},
		'l13Projects.action.workspaces.group.openAll': ({ group }:GroupCustomTreeItem) => files.openAll(group.paths),
		'l13Projects.action.workspaces.group.rename': ({ group }:GroupCustomTreeItem) => WorkspaceGroups.renameWorkspaceGroup(context, group),
		'l13Projects.action.workspaces.group.remove': ({ group }:GroupCustomTreeItem) => WorkspaceGroups.removeWorkspaceGroup(context, group),
		'l13Projects.action.workspaces.groups.clear': () => WorkspaceGroups.clearWorkspaceGroups(context),
		
		'l13Projects.action.project.rename': ({ project }:ProjectTreeItem) => Workspaces.renameProject(context, project),
		'l13Projects.action.project.remove': ({ project }:ProjectTreeItem) => Workspaces.removeProject(context, project),
		
		'l13Projects.action.project.selectColor': ({ project }:ProjectTreeItem) => {
			
			workspacesProvider.showColorPicker(project);
			treeView.reveal(colorPicker, { focus: true, select: true });
			
		},
		'l13Projects.action.project.pickColor1': () => StatusBartColor.assignColor(context, colorPicker, 1),
		'l13Projects.action.project.pickColor2': () => StatusBartColor.assignColor(context, colorPicker, 2),
		'l13Projects.action.project.pickColor3': () => StatusBartColor.assignColor(context, colorPicker, 3),
		'l13Projects.action.project.pickColor4': () => StatusBartColor.assignColor(context, colorPicker, 4),
		'l13Projects.action.project.pickColor5': () => StatusBartColor.assignColor(context, colorPicker, 5),
		'l13Projects.action.project.pickColor6': () => StatusBartColor.assignColor(context, colorPicker, 6),
		'l13Projects.action.project.pickColor7': () => StatusBartColor.assignColor(context, colorPicker, 7),
		'l13Projects.action.project.removeColor': () => StatusBartColor.assignColor(context, colorPicker, 0),
		'l13Projects.action.project.hideColorPicker': () => workspacesProvider.hideColorPicker(),
		
		'l13Projects.action.projects.clear': () => WorkspacesProvider.clearProjects(context),
	});
	
}

//	Functions __________________________________________________________________

