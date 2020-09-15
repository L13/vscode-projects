//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { formatLabel } from '../@l13/formats';
import { isMacOs, isWindows } from '../@l13/platforms';

import { Project } from '../@types/workspaces';

import * as settings from '../common/settings';

//	Variables __________________________________________________________________

let command = 'l13Projects.showProjectInFolder';

//	Initialize _________________________________________________________________

if (isMacOs) command = 'l13Projects.showProjectInFinder';
else if (isWindows) command = 'l13Projects.showProjectInExplorer';

//	Exports ____________________________________________________________________

export class StatusBar {
	
	private readonly statusBarItem:vscode.StatusBarItem;
	
	public static current:StatusBar;
	
	private constructor (private context:vscode.ExtensionContext) {
		
		this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
		
		if (command) this.statusBarItem.command = command;
		
		this.update();
		this.statusBarItem.show();
		
		context.subscriptions.push(this.statusBarItem);
		
	}
	
	public update () :void {
		
		const workspacePath = settings.getCurrentWorkspacePath();
		
		if (workspacePath) {
			const icon = settings.isCodeWorkspace(workspacePath) ? 'submodule' : 'directory';
			const name:string = this.getProjectName('projects', workspacePath) || this.getProjectName('favorites', workspacePath);
			
			this.statusBarItem.text = `$(file-${icon}) ${name || formatLabel(workspacePath)}`;
			this.statusBarItem.tooltip = workspacePath;
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

