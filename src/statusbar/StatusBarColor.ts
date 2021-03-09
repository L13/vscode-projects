//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { Project } from '../@types/workspaces';

import * as settings from '../common/settings';
import * as states from '../common/states';

import { colors } from './colors';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class StatusBarColor {
	
	private static current:StatusBarColor = null;
	
	public static create (context:vscode.ExtensionContext) {
		
		return StatusBarColor.current || (StatusBarColor.current = new StatusBarColor(context));
		
	}
	
	public constructor (private readonly context:vscode.ExtensionContext) {
		
		if (!settings.get('useCacheForDetectedProjects', false)) this.detectProjectColors();
		
	}
	
	private _onDidUpdateColor:vscode.EventEmitter<Project> = new vscode.EventEmitter<Project>();
	public readonly onDidUpdateColor:vscode.Event<Project> = this._onDidUpdateColor.event;
	
	private _onDidChangeColor:vscode.EventEmitter<Project> = new vscode.EventEmitter<Project>();
	public readonly onDidChangeColor:vscode.Event<Project> = this._onDidChangeColor.event;
	
	public detectProjectColors () {
		
		const projects = states.getProjects(this.context);
		let hasChangedColor = false;
		
		for (const project of projects) {
			const statusBarColors = settings.getStatusBarColorSettings(project.path);
			if (statusBarColors) {
				detect:for (let i = 1; i < colors.length; i++) {
					const color:any = colors[i];
					for (const name in color) {
						if (color[name] !== statusBarColors[name]) continue detect;
					}
					if (project.color !== i) {
						project.color = i;
						this._onDidUpdateColor.fire(project);
						hasChangedColor = true;
					}
					break detect;
				}
			}
		}
		
		if (hasChangedColor) states.updateProjects(this.context, projects);
		
	}
	
	public assignProjectColor (currentProject:Project, color:number) {
		
		const projects = states.getProjects(this.context);
		
		for (const project of projects) {
			if (currentProject.path === project.path) {
				if (color) project.color = color;
				else delete project.color;
				states.updateProjects(this.context, projects);
				settings.updateStatusBarColorSettings(project.path, colors[color]);
				this._onDidChangeColor.fire(project);
				break;
			}
		}
		
	}
	
}

//	Functions __________________________________________________________________

