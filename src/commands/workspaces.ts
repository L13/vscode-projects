//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { GroupTreeItem, WorkspaceTreeItems } from '../@types/workspaces';

import * as commands from '../common/commands';
import * as files from '../common/files';
import * as settings from '../common/settings';

import { ColorPickerTreeItem } from '../sidebar/trees/ColorPickerTreeItem';
import { GroupCustomTreeItem } from '../sidebar/trees/GroupCustomTreeItem';
import { GroupSimpleTreeItem } from '../sidebar/trees/GroupSimpleTreeItem';
import { GroupTypeTreeItem } from '../sidebar/trees/GroupTypeTreeItem';
import { ProjectTreeItem } from '../sidebar/trees/ProjectTreeItem';

import { FavoriteGroupsState } from '../states/FavoriteGroupsState';
import { FavoritesState } from '../states/FavoritesState';
import { HotkeySlotsState } from '../states/HotkeySlotsState';
import { ProjectsState } from '../states/ProjectsState';
import { StatusBarColor } from '../states/StatusBarColor';
import { WorkspaceGroupsState } from '../states/WorkspaceGroupsState';
import { WorkspacesState } from '../states/WorkspacesState';

import { WorkspacesProvider } from '../sidebar/WorkspacesProvider';

import { StatusBar } from '../statusbar/StatusBar';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function activate (context:vscode.ExtensionContext) {
	
	const colorPicker = new ColorPickerTreeItem();
	
	const favoritesState = FavoritesState.createFavoritesState(context);
	const favoriteGroupsState = FavoriteGroupsState.createFavoriteGroupsState(context);
	
	const hotkeySlotsState = HotkeySlotsState.createHotkeySlotsState(context);
	
	const projectsState = ProjectsState.createProjectsState(context);
	const workspacesState = WorkspacesState.createWorkspacesState(context);
	const workspaceGroupState = WorkspaceGroupsState.createWorkspaceGroupsState(context);
	const workspacesProvider = WorkspacesProvider.createWorkspacesProvider({
		hotkeySlots: hotkeySlotsState,
		workspaces: workspacesState,
		workspaceGroups: workspaceGroupState,
	}, colorPicker);
	const treeView = vscode.window.createTreeView('l13ProjectsWorkspaces', {
		treeDataProvider: workspacesProvider,
		showCollapseAll: true,
	});
	
	
	treeView.onDidCollapseElement(({ element }) => saveCollapseState(workspaceGroupState, <GroupTreeItem>element, true));
	treeView.onDidExpandElement(({ element }) => saveCollapseState(workspaceGroupState, <GroupTreeItem>element, false));
	
	treeView.onDidChangeSelection((event) => {
		
		if (event.selection[0] !== colorPicker) {
			colorPicker.project = null;
			workspacesProvider.refresh();
		}
		
	});
		
	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((event) => {
		
		if (event.affectsConfiguration('l13Projects.sortWorkspacesBy')) {
			workspacesProvider.sortWorkspacesBy = settings.get('sortWorkspacesBy');
			workspacesProvider.refresh();
		}
		
	}));
	
	workspacesProvider.onDidChangeTreeData(() => StatusBar.current?.update());
	
	projectsState.onDidUpdateProject((project) => {
		
		favoritesState.updateFavorite(project);
		HotkeySlotsState.createHotkeySlotsState(context).update(project);
		
	});
	
	projectsState.onDidDeleteProject((project) => {
		
		favoritesState.removeFavorite(project, true);
		HotkeySlotsState.createHotkeySlotsState(context).remove(project);
		
	});
	
	workspacesState.onDidChangeCache(() => {
		
		workspacesProvider.refresh({
			workspaces: true,
			workspaceGroups: true,
		});
		
	});
	
	workspaceGroupState.onDidUpdateWorkspaceGroup((workspaceGroup) => {
		
		const workspaces = workspaceGroup.paths.map((path) => workspacesState.getWorkspaceByPath(path));
		
		favoriteGroupsState.updateFavoriteGroup(workspaceGroup, workspaces);
		HotkeySlotsState.createHotkeySlotsState(context).updateGroup(workspaceGroup);
		
	});
	
	workspaceGroupState.onDidDeleteWorkspaceGroup((workspaceGroup) => {
		
		favoriteGroupsState.removeFavoriteGroup(workspaceGroup);
		HotkeySlotsState.createHotkeySlotsState(context).removeGroup(workspaceGroup);
		
	});
	
	StatusBarColor.onDidUpdateColor((project) => {
		
		favoritesState.updateFavorite(project);
		
	});
	
	projectsState.onDidChangeWorkspaces(() => workspacesProvider.refresh());
	workspaceGroupState.onDidChangeWorkspaceGroups(() => workspacesProvider.refresh());
	StatusBarColor.onDidChangeColor(() => workspacesProvider.refresh());
	
	context.subscriptions.push(treeView);
	
	commands.register(context, {
		
		'l13Projects.action.workspace.open': ({ project }:WorkspaceTreeItems) => files.open(project.path),
		'l13Projects.action.workspace.openInCurrentWindow': ({ project }:WorkspaceTreeItems) => files.open(project.path, false),
		'l13Projects.action.workspace.openInNewWindow': ({ project }:WorkspaceTreeItems) => files.open(project.path, true),
		
		'l13Projects.action.workspace.addToWorkspace': ({ project }:WorkspaceTreeItems) => WorkspacesProvider.addToWorkspace(project),
		'l13Projects.action.workspace.addToFavorites': ({ project }:ProjectTreeItem) => favoritesState.addToFavorites(project),
		'l13Projects.action.workspace.addToGroup': ({ project }:WorkspaceTreeItems) => workspaceGroupState.addWorkspaceToGroup(project),
		'l13Projects.action.workspace.removeFromGroup': ({ project }:WorkspaceTreeItems) => workspaceGroupState.removeFromWorkspaceGroup(project),
		
		'l13Projects.action.workspaces.addProject': () => projectsState.addProject(),
		'l13Projects.action.workspaces.addProjectWorkspace': () => projectsState.addProjectWorkspace(),
		'l13Projects.action.workspaces.saveProject': () => projectsState.saveProject(),
		'l13Projects.action.workspaces.saveDetectedProject': ({ project }:WorkspaceTreeItems) => projectsState.saveProject(project),
		'l13Projects.action.workspaces.pickWorkspace': async () => workspacesState.pickWorkspace(),
		'l13Projects.action.workspaces.refresh': () => {
			
			StatusBarColor.detectProjectColors(context);
			workspacesState.detectWorkspaces();
			
		},
		
		'l13Projects.action.workspaces.group.add': () => workspaceGroupState.addWorkspaceGroup(),
		'l13Projects.action.workspaces.group.addToFavorites': ({ group }:GroupCustomTreeItem) => {
			
			const workspaces = group.paths.map((path) => workspacesState.getWorkspaceByPath(path));
			
			favoriteGroupsState.addWorkspaceGroupToFavorites(group, workspaces.filter((workspace) => !!workspace));
			
		},
		'l13Projects.action.workspaces.group.rename': ({ group }:GroupCustomTreeItem) => workspaceGroupState.renameWorkspaceGroup(group),
		'l13Projects.action.workspaces.group.remove': ({ group }:GroupCustomTreeItem) => workspaceGroupState.removeWorkspaceGroup(group),
		'l13Projects.action.workspaces.groups.clear': () => workspaceGroupState.clearWorkspaceGroups(),
		
		'l13Projects.action.project.rename': ({ project }:ProjectTreeItem) => projectsState.renameProject(project),
		'l13Projects.action.project.remove': ({ project }:ProjectTreeItem) => projectsState.removeProject(project),
		
		'l13Projects.action.project.selectColor': ({ project }:ProjectTreeItem) => {
			
			workspacesProvider.showColorPicker(project);
			treeView.reveal(colorPicker, { focus: true, select: true });
			
		},
		'l13Projects.action.project.pickColor1': () => StatusBarColor.assignColor(context, colorPicker, 1),
		'l13Projects.action.project.pickColor2': () => StatusBarColor.assignColor(context, colorPicker, 2),
		'l13Projects.action.project.pickColor3': () => StatusBarColor.assignColor(context, colorPicker, 3),
		'l13Projects.action.project.pickColor4': () => StatusBarColor.assignColor(context, colorPicker, 4),
		'l13Projects.action.project.pickColor5': () => StatusBarColor.assignColor(context, colorPicker, 5),
		'l13Projects.action.project.pickColor6': () => StatusBarColor.assignColor(context, colorPicker, 6),
		'l13Projects.action.project.pickColor7': () => StatusBarColor.assignColor(context, colorPicker, 7),
		'l13Projects.action.project.removeColor': () => StatusBarColor.assignColor(context, colorPicker, 0),
		'l13Projects.action.project.hideColorPicker': () => workspacesProvider.hideColorPicker(),
		
		'l13Projects.action.projects.clear': () => projectsState.clearProjects(),
	});
	
}

//	Functions __________________________________________________________________

function saveCollapseState (workspaceGroupState:WorkspaceGroupsState, item:GroupTreeItem, collapsed:boolean) {
		
	if (item instanceof GroupCustomTreeItem) workspaceGroupState.saveWorkspaceGroupState(item, collapsed);
	else if (item instanceof GroupSimpleTreeItem) workspaceGroupState.saveGroupSimpleState(item, collapsed);
	else if (item instanceof GroupTypeTreeItem) workspaceGroupState.saveGroupTypeState(item, collapsed);
	
}