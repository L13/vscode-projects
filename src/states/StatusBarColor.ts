//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { Project } from '../@types/workspaces';

import * as settings from '../common/settings';
import * as states from '../common/states';

import { colors } from '../statusbar/colors';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class StatusBarColorState {
	
	private static currentStatusBarColorState:StatusBarColorState = null;
	
	public static createProjectsState (context:vscode.ExtensionContext) {
		
		return StatusBarColorState.currentStatusBarColorState || (StatusBarColorState.currentStatusBarColorState = new StatusBarColorState(context));
		
	}
	
	public constructor (private readonly context:vscode.ExtensionContext) {}
	
	private _onDidUpdateColor:vscode.EventEmitter<Project> = new vscode.EventEmitter<Project>();
	public readonly onDidUpdateColor:vscode.Event<Project> = this._onDidUpdateColor.event;
	
	private _onDidChangeColor:vscode.EventEmitter<undefined> = new vscode.EventEmitter<undefined>();
	public readonly onDidChangeColor:vscode.Event<undefined> = this._onDidChangeColor.event;
	
	public detectProjectColors () {
		
		const projects = states.getProjects(this.context);
		let hasChangedColor = false;
		
		projects.forEach((project) => {
			
			const statusBarColors = settings.getStatusBarColorSettings(project.path);
			
			if (statusBarColors) {
				colors:for (let i = 1; i < colors.length; i++) {
					const color:any = colors[i];
					for (const name in color) {
						if (color[name] !== statusBarColors[name]) continue colors;
					}
					project.color = i;
					hasChangedColor = true;
					this._onDidUpdateColor.fire(project);
					break colors;
				}
			}
			
		});
		
		if (hasChangedColor) {
			states.updateProjects(this.context, projects);
			this._onDidChangeColor.fire(undefined);
		}
		
	}
	
	public assignColor (currentProject:Project, color:number) {
		
		const projects = states.getProjects(this.context);
		
		for (const project of projects) {
			if (currentProject.path === project.path) {
				if (color) project.color = color;
				else delete project.color;
				states.updateProjects(this.context, projects);
				settings.updateStatusBarColorSettings(project.path, colors[color]);
				this._onDidUpdateColor.fire(project);
				this._onDidChangeColor.fire(undefined);
				break;
			}
		}
		
	}
	
}

//	Functions __________________________________________________________________

