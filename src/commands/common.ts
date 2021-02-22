//	Imports ____________________________________________________________________

import * as path from 'path';
import * as vscode from 'vscode';

import * as commands from '../common/commands';
import * as files from '../common/files';
import * as settings from '../common/settings';
import * as terminal from '../common/terminal';

import { Project } from '../@types/workspaces';
import { HotkeySlots } from '../features/HotkeySlots';
import { FavoritesProvider } from '../sidebar/FavoritesProvider';
import { WorkspacesProvider } from '../sidebar/WorkspacesProvider';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function activate (context:vscode.ExtensionContext) {
	
	context.subscriptions.push(vscode.window.onDidChangeWindowState(({ focused }) => {
		
		if (focused) { // Update data if changes in another workspace have been done
			HotkeySlots.saveCurrentWorkspace(context);
			HotkeySlots.current?.refresh();
			FavoritesProvider.currentProvider?.refresh();
			WorkspacesProvider.currentProvider?.refresh();
		}
		
	}));
	
	commands.register(context, {
		'l13Projects.action.explorer.openInNewWindow': (uri) => vscode.commands.executeCommand('vscode.openFolder', uri, true),
		'l13Projects.action.explorer.openInCurrentWindow': (uri) => vscode.commands.executeCommand('vscode.openFolder', uri, false),
		'l13Projects.action.workspace.revealInFinder': (item) => files.reveal(item?.project.path || settings.getCurrentWorkspacePath()),
		'l13Projects.action.workspace.revealInExplorer': (item) => files.reveal(item?.project.path || settings.getCurrentWorkspacePath()),
		'l13Projects.action.workspace.openContainingFolder': (item) => files.reveal(item?.project.path || settings.getCurrentWorkspacePath()),
		'l13Projects.action.workspace.openInTerminal': ({ project }) => terminal.open(getFolderPath(project)),
		'l13Projects.action.workspace.copyPath': ({ project }) => vscode.env.clipboard.writeText(project.path),
	});

}

//	Functions __________________________________________________________________

function getFolderPath (project:Project) {
	
	return project.type === 'folders' || project.type === 'workspace' ? path.dirname(project.path) : project.path;
	
}