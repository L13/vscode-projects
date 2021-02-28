//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { Favorite } from '../@types/favorites';
import { Project } from '../@types/workspaces';

import * as settings from '../common/settings';
import * as states from '../common/states';

import { colors } from '../statusbar/colors';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class StatusBartColor {
	
	private static _onDidUpdateColor:vscode.EventEmitter<Favorite> = new vscode.EventEmitter<Favorite>();
	public static readonly onDidUpdateColor:vscode.Event<Favorite> = StatusBartColor._onDidUpdateColor.event;
	
	private static _onDidChangeColor:vscode.EventEmitter<undefined> = new vscode.EventEmitter<undefined>();
	public static readonly onDidChangeColor:vscode.Event<undefined> = StatusBartColor._onDidChangeColor.event;
	
	public static detectProjectColors (context:vscode.ExtensionContext) {
		
		const projects = states.getProjects(context);
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
					StatusBartColor._onDidUpdateColor.fire(project);
					break colors;
				}
			}
			
		});
		
		if (hasChangedColor) {
			states.updateProjects(context, projects);
			StatusBartColor._onDidChangeColor.fire();
		}
		
	}
	
	public static assignColor (context:vscode.ExtensionContext, currentProject:Project, color:number) {
		
		const projects = states.getProjects(context);
		
		for (const project of projects) {
			if (currentProject.path === project.path) {
				if (color) project.color = color;
				else delete project.color;
				states.updateProjects(context, projects);
				settings.updateStatusBarColorSettings(project.path, colors[color]);
				StatusBartColor._onDidUpdateColor.fire(project);
				StatusBartColor._onDidChangeColor.fire();
				break;
			}
		}
		
	}
	
}

//	Functions __________________________________________________________________

