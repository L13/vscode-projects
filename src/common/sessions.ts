//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import type { FavoriteGroup } from '../@types/favorites';
import type { Tag } from '../@types/tags';
import type { WorkspaceGroup } from '../@types/workspaces';

import * as dialogs from '../common/dialogs';
import * as files from '../common/files';
import * as settings from '../common/settings';
import { isCodeWorkspace } from '../common/workspaces';

import { ProjectsState } from '../states/ProjectsState';
import { SessionsState } from '../states/SessionsState';

import { createUri, getPath } from './uris';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function openSession (paths: string[], projectsState: ProjectsState) {
	
	const uris = getWorkspaceUris(paths, projectsState);
	
	if (uris.length) {
		const remove = vscode.workspace.workspaceFolders?.length || 0;
		vscode.workspace.updateWorkspaceFolders(0, remove, ...uris);
	}
	
}

export async function openMultipleWindows (group: FavoriteGroup|WorkspaceGroup|Tag, openInNewWindow: boolean) {
	
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

export async function openAsWorkspace (currentPaths: string[], sessionsState: SessionsState, projectsState: ProjectsState) {
	
	if (!currentPaths.length) return;
	
	const paths = await getFolders(currentPaths);
	const workspaceFolders = vscode.workspace.workspaceFolders;
	
	if (workspaceFolders?.length === paths.length) {
		const hasSamePaths = paths.every((fsPath) => {
			
			return workspaceFolders.some((folder) => getPath(folder.uri) === fsPath);
			
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

export async function addFoldersToWorkspace (currentPaths: string[], projectsState: ProjectsState) {
	
	const paths = (await getFolders(currentPaths)).filter((fsPath) => {
				
		return !vscode.workspace.workspaceFolders?.find((workspace) => getPath(workspace.uri) === fsPath);
		
	});
	
	const uris = getWorkspaceUris(paths, projectsState);
	
	if (uris.length) {
		const start = vscode.workspace.workspaceFolders?.length || 0;
		vscode.workspace.updateWorkspaceFolders(start, 0, ...uris);
	}
	
}

//	Functions __________________________________________________________________

async function getFolders (paths: string[]) {
	
	const values: string[] = [];
	
	for (const fsPath of paths) {
		const folders = isCodeWorkspace(fsPath) ? (await settings.getWorkspaceFolders(fsPath)).map((workspace) => workspace.path) : [fsPath];
		for (const folder of folders) {
			if (!values.includes(folder)) values.push(folder);
		}
	}
	
	return values;
	
}

function getWorkspaceUris (paths: string[], projectsState: ProjectsState) {
	
	return paths.map((fsPath) => {
		
		const name = projectsState.getByPath(fsPath)?.label;
		
		return {
			name,
			uri: createUri(fsPath),
		};
		
	});
	
}