//	Imports ____________________________________________________________________

import * as path from 'path';
import * as vscode from 'vscode';

import * as commands from '../common/commands';
import * as files from '../common/files';
import * as settings from '../common/settings';
import * as terminal from '../common/terminal';

import { Project } from '../@types/workspaces';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function activate (context:vscode.ExtensionContext) {
	
	commands.register(context, {
		'l13Projects.openInNewWindow': (uri) => vscode.commands.executeCommand('vscode.openFolder', uri, true),
		'l13Projects.openInCurrentWindow': (uri) => vscode.commands.executeCommand('vscode.openFolder', uri, false),
		'l13Projects.showProjectInFinder': (item) => files.reveal(item?.project.path || settings.getCurrentWorkspacePath()),
		'l13Projects.showProjectInExplorer': (item) => files.reveal(item?.project.path || settings.getCurrentWorkspacePath()),
		'l13Projects.showProjectInFolder': (item) => files.reveal(item?.project.path || settings.getCurrentWorkspacePath()),
		'l13Projects.openInTerminal': ({ project }) => terminal.open(getFolderPath(project)),
		'l13Projects.copyPath': ({ project }) => vscode.env.clipboard.writeText(project.path),
	});

}

//	Functions __________________________________________________________________

function getFolderPath (project:Project) {
	
	return project.type === 'folders' || project.type === 'workspace' ? path.dirname(project.path) : project.path;
	
}