//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import * as commands from '../common/commands';

import { Output } from '../output/Output';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function activate (context: vscode.ExtensionContext) {
	
	commands.register(context, {
		'l13Projects.action.output.show': () => Output.current?.show(),
	});
	
}

//	Functions __________________________________________________________________

