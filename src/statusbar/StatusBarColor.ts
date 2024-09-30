//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import type { Project } from '../@types/workspaces';

import * as settings from '../common/settings';
import * as states from '../common/states';
import { getPath } from '../common/uris';
import * as workspaces from '../common/workspaces';

import { colors } from './colors';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class StatusBarColor {
	
	private static current: StatusBarColor = null;
	
	public static create (context: vscode.ExtensionContext) {
		
		return StatusBarColor.current || (StatusBarColor.current = new StatusBarColor(context));
		
	}
	
	private constructor (private readonly context: vscode.ExtensionContext) {}
	
	private _onDidUpdateColor: vscode.EventEmitter<Project> = new vscode.EventEmitter<Project>();
	public readonly onDidUpdateColor: vscode.Event<Project> = this._onDidUpdateColor.event;
	
	private _onDidChangeColor: vscode.EventEmitter<Project> = new vscode.EventEmitter<Project>();
	public readonly onDidChangeColor: vscode.Event<Project> = this._onDidChangeColor.event;
	
	public async detectProjectColors () {
		
		const projects = states.getProjects(this.context);
		let hasChangedColor = false;
		
		for (const project of projects) {
			if (project.remote) continue;
			const statusBarColors = await settings.getStatusBarColorSettings(project.path);
			if (statusBarColors) {
				detect: for (let i = 1; i < colors.length; i++) {
					const color: any = colors[i];
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
	
	public async detectCurrentProjectColor () {
		
		const currentWorkspaceUri = workspaces.getCurrentWorkspaceUri();
		
		if (!currentWorkspaceUri || workspaces.isRemoteWorkspace(currentWorkspaceUri)) return;
		
		const workspacePath = getPath(currentWorkspaceUri);
		const statusBarColors = await settings.getStatusBarColorSettings(workspacePath);
		
		if (statusBarColors) {
			const projects = states.getProjects(this.context);
			for (const project of projects) {
				if (project.path === workspacePath) {
					detect: for (let i = 1; i < colors.length; i++) {
						const color: any = colors[i];
						for (const name in color) {
							if (color[name] !== statusBarColors[name]) continue detect;
						}
						if (project.color !== i) {
							project.color = i;
							states.updateProjects(this.context, projects);
							this._onDidUpdateColor.fire(project);
						}
						return;
					}
				}
			}
		}
		
	}
	
	public assignProjectColor (currentProject: Project, color: number) {
		
		const projects = states.getProjects(this.context);
		
		for (const project of projects) {
			if (project.remote) continue;
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

