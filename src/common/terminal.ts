//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function open (pathanme:string) {

	vscode.window.createTerminal({ cwd: pathanme }).show();
	
}

//	Functions __________________________________________________________________

