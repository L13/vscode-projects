//	Imports ____________________________________________________________________

import * as path from 'path';
import * as vscode from 'vscode';

import { CommonGroupTreeItems } from '../@types/common';
import { FavoriteTreeItem, HistoryTreeItem } from '../@types/diff';
import { FavoriteGroup } from '../@types/favorites';
import { Tag } from '../@types/tags';
import { Project, WorkspaceGroup } from '../@types/workspaces';

import * as commands from '../common/commands';
import * as dialogs from '../common/dialogs';
import * as files from '../common/files';
import * as settings from '../common/settings';
import * as terminal from '../common/terminal';
import { getCurrentWorkspacePath, isCodeWorkspace } from '../common/workspaces';

import { DiffFoldersDialog } from '../dialogs/DiffFoldersDialog';

import { FavoriteGroupTreeItem } from '../sidebar/trees/groups/FavoriteGroupTreeItem';
import { WorkspaceGroupTreeItem } from '../sidebar/trees/groups/WorkspaceGroupTreeItem';
import { ProjectTreeItem } from '../sidebar/trees/items/ProjectTreeItem';
import { TagTreeItem } from '../sidebar/trees/items/TagTreeItem';

import { FavoritesProvider } from '../sidebar/FavoritesProvider';
import { TagsProvider } from '../sidebar/TagsProvider';
import { WorkspacesProvider } from '../sidebar/WorkspacesProvider';

import { FavoriteGroupsState } from '../states/FavoriteGroupsState';
import { FavoritesState } from '../states/FavoritesState';
import { HotkeySlotsState } from '../states/HotkeySlotsState';
import { ProjectsState } from '../states/ProjectsState';
import { SessionsState } from '../states/SessionsState';
import { TagsState } from '../states/TagsState';
import { WorkspaceGroupsState } from '../states/WorkspaceGroupsState';
import { WorkspacesState } from '../states/WorkspacesState';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function activate (context:vscode.ExtensionContext) {
	
	const projectsState = ProjectsState.create(context);
	const sessionsState = SessionsState.create(context);
	const session = sessionsState.current();
	
	if (session) {
		sessionsState.clear();
		openSession(session.paths, projectsState);
		vscode.commands.executeCommand('workbench.view.explorer');
	}
	
	const favoritesState = FavoritesState.create(context);
	const favoriteGroupsState = FavoriteGroupsState.create(context);
	
	const hotkeySlots = HotkeySlotsState.create(context);
	
	const tagsState = TagsState.create(context);
	
	const workspacesState = WorkspacesState.create(context);
	const workspaceGroupsState = WorkspaceGroupsState.create(context);
	
	const diffFoldersDialog = DiffFoldersDialog.create(projectsState);
	
	context.subscriptions.push(vscode.window.onDidChangeWindowState(({ focused }) => {
		
		if (focused) { // Update data if changes in another workspace have been done
			const tags = tagsState.get();
			
			hotkeySlots.saveCurrentWorkspace();
			hotkeySlots.refresh();
			
			FavoritesProvider.current?.refresh({
				favorites: favoritesState.get(),
				favoriteGroups: favoriteGroupsState.get(),
				tags,
			});
			
			if (workspacesState.cache) {
				WorkspacesProvider.current?.refresh({
					workspaces: workspacesState.get(),
					workspaceGroups: workspaceGroupsState.get(),
					tags,
				});
			}
			
			TagsProvider.current?.refresh({
				tags,
			});
		}
		
	}));
	
	commands.register(context, {
		'l13Projects.action.explorer.openInNewWindow': (uri:vscode.Uri) => vscode.commands.executeCommand('vscode.openFolder', uri, true),
		'l13Projects.action.explorer.openInCurrentWindow': (uri:vscode.Uri) => vscode.commands.executeCommand('vscode.openFolder', uri, false),
		
		'l13Projects.action.workspace.revealInFinder': (item:ProjectTreeItem) => files.reveal(item?.project.path || getCurrentWorkspacePath()),
		'l13Projects.action.workspace.revealInExplorer': (item:ProjectTreeItem) => files.reveal(item?.project.path || getCurrentWorkspacePath()),
		'l13Projects.action.workspace.openContainingFolder': (item:ProjectTreeItem) => files.reveal(item?.project.path || getCurrentWorkspacePath()),
		'l13Projects.action.workspace.openInTerminal': ({ project }:ProjectTreeItem) => terminal.open(getFolderPath(project)),
		'l13Projects.action.workspace.copyPath': ({ project }:ProjectTreeItem) => vscode.env.clipboard.writeText(project.path),
		
		'l13Projects.action.group.openAllInCurrentAndNewWindows': async ({ group }:CommonGroupTreeItems) => openMultipleWindows(group, false),
		'l13Projects.action.group.openAllInNewWindows': async ({ group }:CommonGroupTreeItems) => openMultipleWindows(group, true),
		
		'l13Projects.action.group.addFoldersToWorkspace': ({ group }:FavoriteGroupTreeItem|WorkspaceGroupTreeItem) => {
			
			addFoldersToWorkspace(group.paths, projectsState);
			
		},
		
		'l13Projects.action.group.openAsWorkspace': ({ group }:FavoriteGroupTreeItem|WorkspaceGroupTreeItem) => {
			
			openAsWorkspace(group.paths, sessionsState, projectsState);
			
		},
		
		'l13Projects.action.tag.openAllInCurrentAndNewWindows': async ({ tag }:TagTreeItem) => openMultipleWindows(tag, false),
		'l13Projects.action.tag.openAllInNewWindows': async ({ tag }:TagTreeItem) => openMultipleWindows(tag, true),
		
		'l13Projects.action.tag.addFoldersToWorkspace': ({ tag }:TagTreeItem) => {
			
			addFoldersToWorkspace(tag.paths, projectsState);
			
		},
		
		'l13Projects.action.tag.openAsWorkspace': ({ tag }:TagTreeItem) => {
			
			openAsWorkspace(tag.paths, sessionsState, projectsState);
			
		},
		
		'l13Projects.action.diff.favorite.openWorkspace': ({ favorite }:FavoriteTreeItem) => {
			
			diffFoldersDialog.openWorkspace([favorite.fileA, favorite.fileB]);
			
		},
		
		'l13Projects.action.diff.favorite.openAsWorkspace': ({ favorite }:FavoriteTreeItem) => {
			
			openAsWorkspace([favorite.fileA, favorite.fileB], sessionsState, projectsState);
			
		},
		
		'l13Projects.action.diff.favorite.addFoldersToWorkspace': ({ favorite }:FavoriteTreeItem) => {
			
			addFoldersToWorkspace([favorite.fileA, favorite.fileB], projectsState);
			
		},
		
		'l13Projects.action.diff.history.openWorkspace': ({ comparison }:HistoryTreeItem) => {
			
			diffFoldersDialog.openWorkspace([comparison.fileA, comparison.fileB]);
			
		},
		
		'l13Projects.action.diff.history.openAsWorkspace': ({ comparison }:HistoryTreeItem) => {
			
			openAsWorkspace([comparison.fileA, comparison.fileB], sessionsState, projectsState);
			
		},
		
		'l13Projects.action.diff.history.addFoldersToWorkspace': ({ comparison }:HistoryTreeItem) => {
			
			addFoldersToWorkspace([comparison.fileA, comparison.fileB], projectsState);
			
		},
	});

}

//	Functions __________________________________________________________________

function getFolderPath (project:Project) {
	
	return project.type === 'folders' || project.type === 'workspace' ? path.dirname(project.path) : project.path;
	
}

function getFolders (paths:string[]) {
	
	const values:string[] = [];
	
	paths.forEach((fsPath) => {
		
		const folders = isCodeWorkspace(fsPath) ? settings.getWorkspaceFolders(fsPath).map((workspace) => workspace.path) : [fsPath];
		
		for (const folder of folders) {
			if (!values.includes(folder)) values.push(folder);
		}
		
	});
	
	return values;
	
}

function getWorkspaceUris (paths:string[], projectsState:ProjectsState) {
	
	return paths.map((fsPath) => {
		
		const name = projectsState.getByPath(fsPath)?.label;
		
		return {
			name,
			uri: vscode.Uri.file(fsPath),
		};
		
	});
	
}

function openSession (paths:string[], projectsState:ProjectsState) {
	
	const uris = getWorkspaceUris(paths, projectsState);
	
	if (uris.length) {
		const remove = vscode.workspace.workspaceFolders?.length || 0;
		vscode.workspace.updateWorkspaceFolders(0, remove, ...uris);
	}
	
}

async function openMultipleWindows (group:FavoriteGroup|WorkspaceGroup|Tag, openInNewWindow:boolean) {
	
	const paths = group.paths;
	
	if (paths.length > 3 && settings.get('confirmOpenMultipleWindows', true)) {
		const buttonOpenDontShowAgain = 'Open, don\'t show again';
		const text = `Open "${group.label}" with ${paths.length} workspaces in multiple windows at once?`;
		const value = await dialogs.confirm(text, 'Open', buttonOpenDontShowAgain);
		if (!value) return;
		if (value === buttonOpenDontShowAgain) settings.update('confirmOpenMultipleWindows', false);
	}
	
	files.openAll(paths, openInNewWindow);
	
}

async function openAsWorkspace (currentPaths:string[], sessionsState:SessionsState, projectsState:ProjectsState) {
	
	if (!currentPaths.length) return;
	
	const paths = getFolders(currentPaths);
	const workspaceFolders = vscode.workspace.workspaceFolders;
	
	if (workspaceFolders?.length === paths.length) {
		const hasSamePaths = paths.every((fsPath) => {
			
			return workspaceFolders.some((folder) => folder.uri.fsPath === fsPath);
			
		});
		if (hasSamePaths) {
			vscode.commands.executeCommand('workbench.view.explorer');
			return;
		}
	}
	
	if (settings.openInNewWindow()) {
		sessionsState.next({ paths });
		vscode.commands.executeCommand('workbench.action.newWindow');
	} else if (workspaceFolders) {
		sessionsState.next({ paths });
		vscode.commands.executeCommand('workbench.action.closeFolder');
	} else {
		await vscode.commands.executeCommand('workbench.view.explorer');
		openSession(paths, projectsState);
	}
	
}

function addFoldersToWorkspace (currentPaths:string[], projectsState:ProjectsState) {
	
	const paths = getFolders(currentPaths).filter((fsPath) => {
				
		return !vscode.workspace.workspaceFolders?.find((workspace) => workspace.uri.fsPath === fsPath);
		
	});
	
	const uris = getWorkspaceUris(paths, projectsState);
	
	if (uris.length) {
		const start = vscode.workspace.workspaceFolders?.length || 0;
		vscode.workspace.updateWorkspaceFolders(start, 0, ...uris);
	}
	
}