//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import * as fse from './fse';
import { createUri } from './uris';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export async function open (pathname: string) {
	
	const uri = createUri(pathname);
	
	if (await fse.exists(uri)) vscode.window.createTerminal({ cwd: uri }).show();
	else vscode.window.showErrorMessage(`Path "${pathname}" doesn't exist!`);
	
}

//	Functions __________________________________________________________________

