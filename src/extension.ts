//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import * as common from './commands/common';
import * as developer from './commands/developer';
import * as favorites from './commands/favorites';
import * as hotkeys from './commands/hotkeys';
import * as workspaces from './commands/workspaces';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function activate (context:vscode.ExtensionContext) {
	
	common.activate(context);
	favorites.activate(context);
	hotkeys.activate(context);
	workspaces.activate(context);
	
	if (context.extensionMode === vscode.ExtensionMode.Development) developer.activate(context);
	
}

export function deactivate () {
	
	//
	
}

//	Functions __________________________________________________________________

