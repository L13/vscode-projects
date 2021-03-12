//	Imports ____________________________________________________________________

import * as path from 'path';
import * as vscode from 'vscode';

import { CommonGroupTreeItems, CommonTreeItems } from '../@types/common';
import { Project } from '../@types/workspaces';

import * as commands from '../common/commands';
import * as files from '../common/files';
import * as terminal from '../common/terminal';
import { getCurrentWorkspacePath } from '../common/workspaces';

import { FavoriteGroupTreeItem } from '../sidebar/trees/groups/FavoriteGroupTreeItem';
import { WorkspaceGroupTreeItem } from '../sidebar/trees/groups/WorkspaceGroupTreeItem';

import { FavoritesProvider } from '../sidebar/FavoritesProvider';
import { WorkspacesProvider } from '../sidebar/WorkspacesProvider';

import { FavoriteGroupsState } from '../states/FavoriteGroupsState';
import { FavoritesState } from '../states/FavoritesState';
import { HotkeySlotsState } from '../states/HotkeySlotsState';
import { ProjectsState } from '../states/ProjectsState';
import { WorkspaceGroupsState } from '../states/WorkspaceGroupsState';
import { WorkspacesState } from '../states/WorkspacesState';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function activate (context:vscode.ExtensionContext) {
	
	const favoritesState = FavoritesState.create(context);
	const favoriteGroupsState = FavoriteGroupsState.create(context);
	
	const hotkeySlots = HotkeySlotsState.create(context);
	
	const projectsState = ProjectsState.create(context);
	
	const workspacesState = WorkspacesState.create(context);
	const workspaceGroupsState = WorkspaceGroupsState.create(context);
	
	context.subscriptions.push(vscode.window.onDidChangeWindowState(({ focused }) => {
		
		if (focused) { // Update data if changes in another workspace have been done
			hotkeySlots.saveCurrentWorkspace();
			hotkeySlots.refresh();
			
			FavoritesProvider.current?.refresh({
				favorites: favoritesState.get(),
				favoriteGroups: favoriteGroupsState.get(),
			});
			
			if (workspacesState.cache) {
				WorkspacesProvider.current?.refresh({
					workspaces: workspacesState.get(),
					workspaceGroups: workspaceGroupsState.get(),
				});
			}
		}
		
	}));
	
	commands.register(context, {
		'l13Projects.action.explorer.openInNewWindow': (uri:vscode.Uri) => vscode.commands.executeCommand('vscode.openFolder', uri, true),
		'l13Projects.action.explorer.openInCurrentWindow': (uri:vscode.Uri) => vscode.commands.executeCommand('vscode.openFolder', uri, false),
		
		'l13Projects.action.workspace.revealInFinder': (item:CommonTreeItems) => files.reveal(item?.project.path || getCurrentWorkspacePath()),
		'l13Projects.action.workspace.revealInExplorer': (item:CommonTreeItems) => files.reveal(item?.project.path || getCurrentWorkspacePath()),
		'l13Projects.action.workspace.openContainingFolder': (item:CommonTreeItems) => files.reveal(item?.project.path || getCurrentWorkspacePath()),
		'l13Projects.action.workspace.openInTerminal': ({ project }:CommonTreeItems) => terminal.open(getFolderPath(project)),
		'l13Projects.action.workspace.copyPath': ({ project }:CommonTreeItems) => vscode.env.clipboard.writeText(project.path),
		
		'l13Projects.action.workspaceGroup.openAllInCurrentWindows': ({ group }:CommonGroupTreeItems) => files.openAll(group.paths, false),
		'l13Projects.action.workspaceGroup.openAllInNewWindows': ({ group }:CommonGroupTreeItems) => files.openAll(group.paths, true),
		
		'l13Projects.action.workspaceGroup.addFoldersToWorkspace': ({ group }:FavoriteGroupTreeItem|WorkspaceGroupTreeItem) => {
			
			const uris = group.paths.filter((path) => {
				
				return !vscode.workspace.workspaceFolders?.find((workspace) => workspace.uri.fsPath === path);
				
			}).map((path) => {
				
				const name = projectsState.getByPath(path)?.label;
				
				return {
					name,
					uri: vscode.Uri.file(path),
				};
				
			});
			
			if (uris.length) {
				const start = vscode.workspace.workspaceFolders?.length || 0;
				vscode.workspace.updateWorkspaceFolders(start, 0, ...uris);
			}
			
		},
	});

}

//	Functions __________________________________________________________________

function getFolderPath (project:Project) {
	
	return project.type === 'folders' || project.type === 'workspace' ? path.dirname(project.path) : project.path;
	
}