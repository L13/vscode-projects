//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { GroupTreeItem, WorkspaceTreeItems } from '../@types/workspaces';

import * as commands from '../common/commands';
import * as files from '../common/files';
import * as settings from '../common/settings';

import { GroupCustomTreeItem } from '../sidebar/trees/GroupCustomTreeItem';
import { GroupSimpleTreeItem } from '../sidebar/trees/GroupSimpleTreeItem';
import { GroupTypeTreeItem } from '../sidebar/trees/GroupTypeTreeItem';
import { ProjectTreeItem } from '../sidebar/trees/ProjectTreeItem';

import { WorkspacesProvider } from '../sidebar/WorkspacesProvider';

import { FavoriteGroupsState } from '../states/FavoriteGroupsState';
import { FavoritesState } from '../states/FavoritesState';
import { HotkeySlotsState } from '../states/HotkeySlotsState';
import { ProjectsState } from '../states/ProjectsState';
import { WorkspaceGroupsState } from '../states/WorkspaceGroupsState';
import { WorkspacesState } from '../states/WorkspacesState';

import { StatusBarColor } from '../statusbar/StatusBarColor';
import { StatusBarInfo } from '../statusbar/StatusBarInfo';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function activate (context:vscode.ExtensionContext) {
	
	const subscriptions = context.subscriptions;
	
	const favoritesState = FavoritesState.createFavoritesState(context);
	const favoriteGroupsState = FavoriteGroupsState.createFavoriteGroupsState(context);
	
	const hotkeySlotsState = HotkeySlotsState.createHotkeySlotsState(context);
	
	const projectsState = ProjectsState.createProjectsState(context);
	
	const statusBarInfo = StatusBarInfo.createStatusBarInfo(context);
	const statusBarColorState = StatusBarColor.createStatusBarColor(context);
	
	const workspacesState = WorkspacesState.createWorkspacesState(context);
	const workspaceGroupsState = WorkspaceGroupsState.createWorkspaceGroupsState(context);
	const workspacesProvider = WorkspacesProvider.createWorkspacesProvider({
		hotkeySlots: hotkeySlotsState,
		workspaces: workspacesState.workspacesCache,
		workspaceGroups: workspaceGroupsState.getWorkspaceGroups(),
		simpleGroups: workspaceGroupsState.getSimpleGroups(),
		typeGroups: workspaceGroupsState.getTypeGroups(),
	});
	
	const treeView = vscode.window.createTreeView('l13ProjectsWorkspaces', {
		treeDataProvider: workspacesProvider,
		showCollapseAll: true,
	});
	
//	Tree View
	
	subscriptions.push(treeView);
	
	subscriptions.push(treeView.onDidCollapseElement(({ element }) => {
		
		saveCollapseState(workspaceGroupsState, <GroupTreeItem>element, true);
		
	}));
	
	subscriptions.push(treeView.onDidExpandElement(({ element }) => {
		
		saveCollapseState(workspaceGroupsState, <GroupTreeItem>element, false);
		
	}));
	
	subscriptions.push(treeView.onDidChangeSelection((event) => {
		
		if (workspacesProvider.colorPickerProject && event.selection[0] !== workspacesProvider.colorPickerTreeItem) {
			workspacesProvider.colorPickerProject = null;
			workspacesProvider.refresh();
		}
		
	}));
	
//	Workspaces Provider
		
	subscriptions.push(vscode.workspace.onDidChangeConfiguration((event) => {
		
		if (event.affectsConfiguration('l13Projects.sortWorkspacesBy')) {
			workspacesProvider.sortWorkspacesBy = settings.get('sortWorkspacesBy');
			workspacesProvider.refresh();
		}
		
	}));
	
	subscriptions.push(workspacesProvider.onWillInitView(() => workspacesState.detectWorkspaces()));
	
//	Projects
	
	subscriptions.push(projectsState.onDidUpdateProject((project) => {
		
		favoritesState.updateFavorite(project);
		hotkeySlotsState.update(project);
		
		workspacesState.refreshWorkspacesCache();
		statusBarInfo.refresh();
		
	}));
	
	subscriptions.push(projectsState.onDidDeleteProject((project) => {
		
		workspacesState.refreshWorkspacesCache();
		
		const workspace = workspacesState.getWorkspaceByPath(project.path);
		
		if (workspace) {
			favoritesState.updateFavorite(workspace);
			hotkeySlotsState.update(workspace);
		} else {
			favoritesState.removeFavorite(project, true);
			hotkeySlotsState.remove(project);
		}
		
		statusBarInfo.refresh();
		
	}));
	
	subscriptions.push(projectsState.onDidChangeProjects(() => {
		
		workspacesState.refreshWorkspacesCache();
		statusBarInfo.refresh();
		
	}));
	
//	Workspaces
	
	subscriptions.push(workspacesState.onDidChangeCache((workspaces) => {
		
		workspacesProvider.refresh({
			workspaces,
		});
		
	}));
	
//	Workspace Groups
	
	subscriptions.push(workspaceGroupsState.onDidUpdateWorkspaceGroup((workspaceGroup) => {
		
		const workspaces = workspaceGroup.paths.map((path) => workspacesState.getWorkspaceByPath(path));
		
		favoriteGroupsState.updateFavoriteGroup(workspaceGroup, workspaces);
		hotkeySlotsState.updateGroup(workspaceGroup);
		
	}));
	
	subscriptions.push(workspaceGroupsState.onDidDeleteWorkspaceGroup((workspaceGroup) => {
		
		favoriteGroupsState.removeFavoriteGroup(workspaceGroup, true);
		hotkeySlotsState.removeGroup(workspaceGroup);
		
	}));
	
	subscriptions.push(workspaceGroupsState.onDidChangeWorkspaceGroups(() => {
		
		workspacesProvider.refresh({
			workspaceGroups: workspaceGroupsState.getWorkspaceGroups(),
		});
		
	}));
	
//	Status Bar
	
	subscriptions.push(statusBarColorState.onDidUpdateColor((project) => {
		
		favoritesState.updateFavorite(project);
		
	}));
	
//	Commands
	
	commands.register(context, {
		
		'l13Projects.action.workspace.open': ({ project }:WorkspaceTreeItems) => files.open(project.path),
		'l13Projects.action.workspace.openInCurrentWindow': ({ project }:WorkspaceTreeItems) => files.open(project.path, false),
		'l13Projects.action.workspace.openInNewWindow': ({ project }:WorkspaceTreeItems) => files.open(project.path, true),
		
		'l13Projects.action.workspace.addToWorkspace': ({ project }:WorkspaceTreeItems) => WorkspacesProvider.addToWorkspace(project),
		'l13Projects.action.workspace.addToFavorites': ({ project }:ProjectTreeItem) => favoritesState.addToFavorites(project),
		'l13Projects.action.workspace.addToGroup': ({ project }:WorkspaceTreeItems) => workspaceGroupsState.addWorkspaceToGroup(project),
		'l13Projects.action.workspace.removeFromGroup': ({ project }:WorkspaceTreeItems) => workspaceGroupsState.removeFromWorkspaceGroup(project),
		
		'l13Projects.action.workspaces.addProject': () => projectsState.addProject(),
		'l13Projects.action.workspaces.addProjectWorkspace': () => projectsState.addProjectWorkspace(),
		'l13Projects.action.workspaces.saveProject': () => projectsState.saveProject(),
		'l13Projects.action.workspaces.saveDetectedProject': ({ project }:WorkspaceTreeItems) => projectsState.saveProject(project),
		'l13Projects.action.workspaces.pickWorkspace': () => workspacesState.pickWorkspace(),
		'l13Projects.action.workspaces.refresh': () => {
			
			statusBarColorState.detectProjectColors();
			workspacesState.detectWorkspaces();
			
		},
		
		'l13Projects.action.workspaces.group.add': () => workspaceGroupsState.addWorkspaceGroup(),
		'l13Projects.action.workspaces.group.addToFavorites': ({ group }:GroupCustomTreeItem) => {
			
			const workspaces = group.paths.map((path) => workspacesState.getWorkspaceByPath(path));
			
			favoriteGroupsState.addWorkspaceGroupToFavorites(group, workspaces.filter((workspace) => !!workspace));
			
		},
		'l13Projects.action.workspaces.group.rename': ({ group }:GroupCustomTreeItem) => workspaceGroupsState.renameWorkspaceGroup(group),
		'l13Projects.action.workspaces.group.remove': ({ group }:GroupCustomTreeItem) => workspaceGroupsState.removeWorkspaceGroup(group),
		'l13Projects.action.workspaces.groups.clear': () => workspaceGroupsState.clearWorkspaceGroups(),
		
		'l13Projects.action.project.rename': ({ project }:ProjectTreeItem) => projectsState.renameProject(project),
		'l13Projects.action.project.remove': ({ project }:ProjectTreeItem) => projectsState.removeProject(project),
		
		'l13Projects.action.project.selectColor': ({ project }:ProjectTreeItem) => {
			
			workspacesProvider.showColorPicker(project);
			treeView.reveal(workspacesProvider.colorPickerTreeItem, { focus: true, select: true });
			
		},
		'l13Projects.action.project.pickColor1': () => changeStatusBarColor(statusBarColorState, workspacesProvider, 1),
		'l13Projects.action.project.pickColor2': () => changeStatusBarColor(statusBarColorState, workspacesProvider, 2),
		'l13Projects.action.project.pickColor3': () => changeStatusBarColor(statusBarColorState, workspacesProvider, 3),
		'l13Projects.action.project.pickColor4': () => changeStatusBarColor(statusBarColorState, workspacesProvider, 4),
		'l13Projects.action.project.pickColor5': () => changeStatusBarColor(statusBarColorState, workspacesProvider, 5),
		'l13Projects.action.project.pickColor6': () => changeStatusBarColor(statusBarColorState, workspacesProvider, 6),
		'l13Projects.action.project.pickColor7': () => changeStatusBarColor(statusBarColorState, workspacesProvider, 7),
		'l13Projects.action.project.removeColor': () => changeStatusBarColor(statusBarColorState, workspacesProvider, 0),
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

function changeStatusBarColor (statusBarColorState:StatusBarColor, workspacesProvider:WorkspacesProvider, color:number) {
	
	statusBarColorState.assignProjectColor(workspacesProvider.colorPickerProject, color);
	workspacesProvider.colorPickerProject = null;
	
}