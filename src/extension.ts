//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import * as common from './commands/common';
import * as favorites from './commands/favorites';
import * as projects from './commands/projects';

import { ProjectsStatus } from './services/ProjectsStatus';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function activate (context:vscode.ExtensionContext) {
	
	const status = ProjectsStatus.createStatusBar(context);
	
	common.activate(context);
	favorites.activate(context, status);
	projects.activate(context, status);
	
}

export function deactivate () {
	
	//
	
}

//	Functions __________________________________________________________________

