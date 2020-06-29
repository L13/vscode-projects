//	Imports ____________________________________________________________________

import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import * as path from 'path';
import * as vscode from 'vscode';

import { isMacOs, isWindows } from '../@l13/platforms';
import { Project } from '../types';

import { Settings } from '../common/Settings';


//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class Open {
	
	public static openFolder (pathname:string, newWindow?:boolean) {
		
		newWindow = newWindow ?? Settings.get('openInNewWindow', false);
		
		vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(pathname), newWindow);
		
	}
	
	public static reveal (pathname:string) :void {
		
		let process:ChildProcessWithoutNullStreams = null;
		
		if (isMacOs) process = showFileInFinder(pathname);
		else if (isWindows) process = showFileInExplorer(pathname);
		else process = showFileInFolder(pathname);
		
		process.on('error', (error:Error) => {
			
			process.kill();
			vscode.window.showErrorMessage(error.message);
			
		});
		
	}
	
	public static openTerminal (project:Project) {
	
		vscode.window.createTerminal({ cwd: getFolderPath(project) }).show();
		
	}
	
}

//	Functions __________________________________________________________________

function showFileInFinder (pathname:string) {
	
	return spawn('open', ['-R', pathname || '/']);
	
}

function showFileInExplorer (pathname:string) {
	
	return spawn('explorer', ['/select,', pathname || 'c:\\']);
	
}

function showFileInFolder (pathname:string) {
	
	return spawn('xdg-open', [path.dirname(pathname) || '/']);
	
}

function getFolderPath (project:Project) {
	
	return project.type === 'folders' || project.type === 'workspace' ? path.dirname(project.path) : project.path;
	
}