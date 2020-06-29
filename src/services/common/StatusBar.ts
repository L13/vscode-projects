//	Imports ____________________________________________________________________

import { basename } from 'path';
import * as vscode from 'vscode';

import { Project } from '../@types/projects';

import { WorkspacesProvider } from '../sidebar/WorkspacesProvider';
import { Settings } from './Settings';

//	Variables __________________________________________________________________

let command = 'l13Projects.showProjectInFolder';

//	Initialize _________________________________________________________________

if (process.platform === 'darwin') command = 'l13Projects.showProjectInFinder';
else if (process.platform === 'win32') command = 'l13Projects.showProjectInExplorer';

//	Exports ____________________________________________________________________

export class StatusBar {
	
	private readonly statusBarItem:vscode.StatusBarItem;
	
	public static current:StatusBar|undefined = undefined;
	
	private constructor (private context:vscode.ExtensionContext) {
		
		this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
		
		if (command) this.statusBarItem.command = command;
		
		this.update();
		this.statusBarItem.show();
		
		context.subscriptions.push(this.statusBarItem);
		
	}
	
	public update () :void {
		
		const workspacePath = Settings.getWorkspacePath();
		
		if (workspacePath) {
			const icon = WorkspacesProvider.isWorkspace(workspacePath) ? 'submodule' : 'directory';
			const name:string = this.getProjectName('projects', workspacePath) || this.getProjectName('favorites', workspacePath);
			
			this.statusBarItem.text = `$(file-${icon}) ${name || basename(workspacePath, '.code-workspace')}`;
		}
		
	}
	
	private getProjectName (stateName:string, workspacePath:string) {
		
		const favorites:Project[] = this.context.globalState.get(stateName) || [];
		
		for (const favorite of favorites) {
			if (favorite.path === workspacePath) return favorite.label;
		}
		
		return '';
		
	}
	
	public dispose () :void {
		
		this.statusBarItem.dispose();
		StatusBar.current = undefined;
		
	}
	
	public static create (context:vscode.ExtensionContext) :StatusBar {
		
		return StatusBar.current || (StatusBar.current = new StatusBar(context));
		
	}
	
}

//	Functions __________________________________________________________________

