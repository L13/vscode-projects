//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { Open } from '../services/actions/Open';
import { Commands } from '../services/common/Commands';
import { Settings } from '../services/common/Settings';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function activate (context:vscode.ExtensionContext) {
	
	Commands.register(context, {
		'l13Projects.openInNewWindow': (uri) => vscode.commands.executeCommand('vscode.openFolder', uri, true),
		'l13Projects.openInCurrentWindow': (uri) => vscode.commands.executeCommand('vscode.openFolder', uri, false),
		'l13Projects.showProjectInFinder': (item) => Open.reveal(item?.project.path || Settings.getWorkspacePath()),
		'l13Projects.showProjectInExplorer': (item) => Open.reveal(item?.project.path || Settings.getWorkspacePath()),
		'l13Projects.showProjectInFolder': (item) => Open.reveal(item?.project.path || Settings.getWorkspacePath()),
		'l13Projects.openInTerminal': ({ project }) => Open.openTerminal(project),
	});

}

//	Functions __________________________________________________________________

