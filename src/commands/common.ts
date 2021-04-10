//	Imports ____________________________________________________________________

import * as path from 'path';
import * as vscode from 'vscode';

import { CommonGroupTreeItems } from '../@types/common';
import { Project } from '../@types/workspaces';

import * as commands from '../common/commands';
import * as files from '../common/files';
import * as sessions from '../common/sessions';
import * as states from '../common/states';
import * as terminal from '../common/terminal';
import { getCurrentWorkspacePath } from '../common/workspaces';

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
		sessions.openSession(session.paths, projectsState);
		vscode.commands.executeCommand('workbench.view.explorer');
	}
	
	const favoritesState = FavoritesState.create(context);
	const favoriteGroupsState = FavoriteGroupsState.create(context);
	
	const hotkeySlots = HotkeySlotsState.create(context);
	
	const tagsState = TagsState.create(context);
	
	const workspacesState = WorkspacesState.create(context);
	const workspaceGroupsState = WorkspaceGroupsState.create(context);
	
	let previousLastModified = states.getStateInfo(context).lastModified;
	
	context.subscriptions.push(vscode.window.onDidChangeWindowState(({ focused }) => {
		
		if (focused) { // Update data if changes in another workspace have been done
			const currentLastModified = states.getStateInfo(context).lastModified;
			if (previousLastModified !== currentLastModified) {
				previousLastModified = currentLastModified;
				
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
		
		'l13Projects.action.group.openAllInCurrentAndNewWindows': ({ group }:CommonGroupTreeItems) => sessions.openMultipleWindows(group, false),
		'l13Projects.action.group.openAllInNewWindows': ({ group }:CommonGroupTreeItems) => sessions.openMultipleWindows(group, true),
		
		'l13Projects.action.group.addFoldersToWorkspace': ({ group }:FavoriteGroupTreeItem|WorkspaceGroupTreeItem) => {
			
			sessions.addFoldersToWorkspace(group.paths, projectsState);
			
		},
		
		'l13Projects.action.group.openAsWorkspace': ({ group }:FavoriteGroupTreeItem|WorkspaceGroupTreeItem) => {
			
			sessions.openAsWorkspace(group.paths, sessionsState, projectsState);
			
		},
		
		'l13Projects.action.tag.openAllInCurrentAndNewWindows': ({ tag }:TagTreeItem) => sessions.openMultipleWindows(tag, false),
		'l13Projects.action.tag.openAllInNewWindows': ({ tag }:TagTreeItem) => sessions.openMultipleWindows(tag, true),
		
		'l13Projects.action.tag.addFoldersToWorkspace': ({ tag }:TagTreeItem) => {
			
			sessions.addFoldersToWorkspace(tag.paths, projectsState);
			
		},
		
		'l13Projects.action.tag.openAsWorkspace': ({ tag }:TagTreeItem) => {
			
			sessions.openAsWorkspace(tag.paths, sessionsState, projectsState);
			
		},
	});

}

//	Functions __________________________________________________________________

function getFolderPath (project:Project) {
	
	return project.type === 'folders' || project.type === 'workspace' ? path.dirname(project.path) : project.path;
	
}