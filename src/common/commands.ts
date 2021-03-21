//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function register (context:vscode.ExtensionContext, commands:{ [command:string]: (...args:any) => void }) {
	
	const subscriptions = context.subscriptions;

	for (const [command, callback] of Object.entries(commands)) {
		subscriptions.push(vscode.commands.registerCommand(command, callback));
	}
	
}

//	Functions __________________________________________________________________

