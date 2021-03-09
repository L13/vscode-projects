//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { GroupTreeItem, Project, WorkspaceTreeItems } from '../@types/workspaces';

import * as commands from '../common/commands';
import * as files from '../common/files';
import * as settings from '../common/settings';

import { FavoriteGroupsDialog } from '../dialogs/FavoriteGroupsDialog';
import { ProjectsDialog } from '../dialogs/ProjectsDialog';
import { WorkspaceGroupsDialog } from '../dialogs/WorkspaceGroupsDialog';
import { WorkspacesDialog } from '../dialogs/WorkspacesDialog';

import { SimpleGroupTreeItem } from '../sidebar/trees/groups/SimpleGroupTreeItem';
import { TypeGroupTreeItem } from '../sidebar/trees/groups/TypeGroupTreeItem';
import { WorkspaceGroupTreeItem } from '../sidebar/trees/groups/WorkspaceGroupTreeItem';
import { ProjectTreeItem } from '../sidebar/trees/items/ProjectTreeItem';
import { WorkspacesProvider } from '../sidebar/WorkspacesProvider';

import { FavoriteGroupsState } from '../states/FavoriteGroupsState';
import { FavoritesState } from '../states/FavoritesState';
import { HotkeySlotsState } from '../states/HotkeySlotsState';
import { ProjectsState } from '../states/ProjectsState';
import { WorkspaceGroupsState } from '../states/WorkspaceGroupsState';
import { WorkspacesState } from '../states/WorkspacesState';

import { colors } from '../statusbar/colors';
import { StatusBarColor } from '../statusbar/StatusBarColor';
import { StatusBarInfo } from '../statusbar/StatusBarInfo';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function activate (context:vscode.ExtensionContext) {
	
	const subscriptions = context.subscriptions;
	
	const statusBarInfo = StatusBarInfo.create(context);
	
	const favoriteGroupsState = FavoriteGroupsState.create(context);
	const favoritesState = FavoritesState.create(context);
	const hotkeySlotsState = HotkeySlotsState.create(context);
	const projectsState = ProjectsState.create(context);
	const statusBarColorState = StatusBarColor.create(context);
	const workspaceGroupsState = WorkspaceGroupsState.create(context);
	const workspacesState = WorkspacesState.create(context);
	
	const projectsDialog = ProjectsDialog.create(projectsState);
	const favoriteGroupsDialog = FavoriteGroupsDialog.create(favoriteGroupsState, workspaceGroupsState);
	const workspaceGroupsDialog = WorkspaceGroupsDialog.create(workspaceGroupsState, favoriteGroupsState);
	const workspacesDialog = WorkspacesDialog.create(workspacesState, workspaceGroupsState);
	
	const workspacesProvider = WorkspacesProvider.create({
		hotkeySlots: hotkeySlotsState,
		simpleGroups: workspaceGroupsState.getSimpleGroups(),
		typeGroups: workspaceGroupsState.getTypeGroups(),
		workspaces: workspacesState.cache,
		workspaceGroups: workspaceGroupsState.get(),
	});
	
	const treeView = vscode.window.createTreeView('l13ProjectsWorkspaces', {
		showCollapseAll: true,
		treeDataProvider: workspacesProvider,
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
	
	subscriptions.push(workspacesProvider.onWillInitView(async () => {
		
		statusBarColorState.detectProjectColors();
		favoritesState.refreshFavoriteExists();
		projectsState.detectProjectExists();
		
		workspacesProvider.refresh({
			workspaces: await workspacesState.detect(),
		});
		
	}));
	
//	Projects
	
	subscriptions.push(projectsState.onDidUpdateProject((project) => {
		
		favoritesState.update(project);
		hotkeySlotsState.updateWorkspace(project);
		
		workspacesState.refresh();
		statusBarInfo.refresh();
		
	}));
	
	subscriptions.push(projectsState.onDidDeleteProject((project) => {
		
		if (project.color) settings.updateStatusBarColorSettings(project.path, colors[0]);
		
		workspacesState.refresh();
		
		const workspace = workspacesState.getByPath(project.path);
		
		if (workspace) {
			favoritesState.update(workspace);
			hotkeySlotsState.updateWorkspace(workspace);
		} else {
			favoritesState.remove(project);
			hotkeySlotsState.removeWorkspace(project);
		}
		
		statusBarInfo.refresh();
		
	}));
	
	subscriptions.push(projectsState.onDidChangeProjects(() => {
		
		workspacesState.refresh();
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
		
		const workspaces = workspaceGroup.paths.map((path) => workspacesState.getByPath(path));
		
		favoriteGroupsState.update(workspaceGroup, workspaces);
		hotkeySlotsState.updateGroup(workspaceGroup);
		
	}));
	
	subscriptions.push(workspaceGroupsState.onDidDeleteWorkspaceGroup((workspaceGroup) => {
		
		favoriteGroupsState.remove(workspaceGroup, true);
		hotkeySlotsState.removeGroup(workspaceGroup);
		
	}));
	
	subscriptions.push(workspaceGroupsState.onDidChangeWorkspaceGroups(() => {
		
		workspacesProvider.refresh({
			workspaceGroups: workspaceGroupsState.get(),
		});
		
	}));
	
//	Status Bar
	
	subscriptions.push(statusBarColorState.onDidChangeColor((project) => {
		
		favoritesState.update(project);
		workspacesState.refresh();
		
	}));
	
//	Commands
	
	commands.register(context, {
		
		'l13Projects.action.workspace.open': ({ project }:WorkspaceTreeItems) => files.open(project.path),
		'l13Projects.action.workspace.openInCurrentWindow': ({ project }:WorkspaceTreeItems) => files.open(project.path, false),
		'l13Projects.action.workspace.openInNewWindow': ({ project }:WorkspaceTreeItems) => files.open(project.path, true),
		
		'l13Projects.action.workspace.addToWorkspace': ({ project }:WorkspaceTreeItems) => addToWorkspace(project),
		'l13Projects.action.workspace.addToFavorites': ({ project }:ProjectTreeItem) => favoritesState.add(project),
		'l13Projects.action.workspace.addToGroup': ({ project }:WorkspaceTreeItems) => workspaceGroupsDialog.addWorkspaceToGroup(project),
		'l13Projects.action.workspace.removeFromGroup': ({ project }:WorkspaceTreeItems) => workspaceGroupsState.removeWorkspace(project),
		
		'l13Projects.action.workspaces.addProject': () => projectsDialog.addDirectory(),
		'l13Projects.action.workspaces.addProjectWorkspace': () => projectsDialog.addVSCodeWorkspace(),
		'l13Projects.action.workspaces.saveProject': () => projectsDialog.save(),
		'l13Projects.action.workspaces.saveDetectedProject': ({ project }:WorkspaceTreeItems) => projectsDialog.save(project),
		
		'l13Projects.action.workspaces.pickWorkspace': () => workspacesDialog.pick(),
		
		'l13Projects.action.workspaces.refresh': () => {
			
			workspacesProvider.refresh({
				task: async () => {
					
					statusBarColorState.detectProjectColors();
					favoritesState.refreshFavoriteExists();
					projectsState.detectProjectExists();
					
					return workspacesState.detect();
					
				}
			});
			
		},
		
		'l13Projects.action.workspaceGroups.add': () => workspaceGroupsDialog.add(),
		'l13Projects.action.workspaceGroups.addToFavorites': ({ group }:WorkspaceGroupTreeItem) => {
			
			const workspaces = group.paths.map((path) => workspacesState.getByPath(path));
			
			favoriteGroupsDialog.addWorkspaceGroup(group, workspaces.filter((workspace) => !!workspace));
			
		},
		'l13Projects.action.workspaceGroups.rename': ({ group }:WorkspaceGroupTreeItem) => workspaceGroupsDialog.rename(group),
		'l13Projects.action.workspaceGroups.remove': ({ group }:WorkspaceGroupTreeItem) => workspaceGroupsDialog.remove(group),
		'l13Projects.action.workspaceGroups.clear': () => workspaceGroupsDialog.clear(),
		
		'l13Projects.action.project.rename': ({ project }:ProjectTreeItem) => projectsDialog.rename(project),
		'l13Projects.action.project.remove': ({ project }:ProjectTreeItem) => projectsDialog.remove(project),
		
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
		
		'l13Projects.action.projects.clear': () => projectsDialog.clear(),
	});
	
}

//	Functions __________________________________________________________________

function saveCollapseState (workspaceGroupState:WorkspaceGroupsState, item:GroupTreeItem, collapsed:boolean) {
	
	if (item instanceof WorkspaceGroupTreeItem) workspaceGroupState.saveWorkspaceGroupState(item, collapsed);
	else if (item instanceof SimpleGroupTreeItem) workspaceGroupState.saveSimpleGroupState(item, collapsed);
	else if (item instanceof TypeGroupTreeItem) workspaceGroupState.saveTypeGroupState(item, collapsed);
	
}

function changeStatusBarColor (statusBarColorState:StatusBarColor, workspacesProvider:WorkspacesProvider, color:number) {
	
	statusBarColorState.assignProjectColor(workspacesProvider.colorPickerProject, color);
	workspacesProvider.colorPickerProject = null;
	
}

function addToWorkspace (project:Project) {
		
	const index:number = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0;
	
	vscode.workspace.updateWorkspaceFolders(index, null, {
		name: project.label,
		uri: vscode.Uri.file(project.path),
	});
	
}