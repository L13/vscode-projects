//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { formatLabel } from '../@l13/formats';
import { isMacOs, isWindows } from '../@l13/platforms';

import * as settings from '../common/settings';
import * as states from '../common/states';

//	Variables __________________________________________________________________

let command = 'l13Projects.action.workspace.openContainingFolder';

//	Initialize _________________________________________________________________

if (isMacOs) command = 'l13Projects.action.workspace.revealInFinder';
else if (isWindows) command = 'l13Projects.action.workspace.revealInExplorer';

//	Exports ____________________________________________________________________

export class StatusBarInfo implements vscode.Disposable {
	
	private readonly statusBarItem:vscode.StatusBarItem;
	
	private static current:StatusBarInfo;
	
	public static create (context:vscode.ExtensionContext) {
		
		return StatusBarInfo.current || (StatusBarInfo.current = new StatusBarInfo(context));
		
	}
	
	private constructor (private context:vscode.ExtensionContext) {
		
		this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
		
		if (command) this.statusBarItem.command = command;
		
		this.refresh();
		this.statusBarItem.show();
		
		context.subscriptions.push(this);
		
	}
	
	public refresh () :void {
		
		const workspacePath = settings.getCurrentWorkspacePath();
		
		if (workspacePath) {
			const icon = settings.isCodeWorkspace(workspacePath) ? 'submodule' : 'directory';
			const name = this.getWorkspaceName(workspacePath);
			
			this.statusBarItem.text = `$(file-${icon}) ${name || formatLabel(workspacePath)}`;
			this.statusBarItem.tooltip = workspacePath;
		}
		
	}
	
	private getWorkspaceName (workspacePath:string) {
		
		const projects = states.getProjects(this.context);
		
		for (const project of projects) {
			if (project.path === workspacePath) return project.label;
		}
		
		return '';
		
	}
	
	public dispose () :void {
		
		this.statusBarItem.dispose();
		StatusBarInfo.current = undefined;
		
	}
	
}

//	Functions __________________________________________________________________

