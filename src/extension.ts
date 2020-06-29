//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import * as common from './commands/common';
import * as favorites from './commands/favorites';
import * as hotkeys from './commands/hotkeys';
import * as projects from './commands/projects';

import { StatusBar } from './services/common/StatusBar';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function activate (context:vscode.ExtensionContext) {
	
	const status = StatusBar.create(context);
	
	common.activate(context);
	favorites.activate(context, status);
	hotkeys.activate(context);
	projects.activate(context, status);
	
}

export function deactivate () {
	
	//
	
}

//	Functions __________________________________________________________________

