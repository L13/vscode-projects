//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { sortCaseInsensitive } from '../@l13/arrays';
import { formatLabel } from '../@l13/formats';

import { Project } from '../@types/workspaces';

import * as settings from '../common/settings';
import * as states from '../common/states';

import { colors } from '../statusbar/colors';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class ProjectsState {
	
	private static currentProjectsState:ProjectsState = null;
	
	public static createProjectsState (context:vscode.ExtensionContext) {
		
		return ProjectsState.currentProjectsState || (ProjectsState.currentProjectsState = new ProjectsState(context));
		
	}
	
	public constructor (private readonly context:vscode.ExtensionContext) {}
	
	private _onDidUpdateProject:vscode.EventEmitter<Project> = new vscode.EventEmitter<Project>();
	public readonly onDidUpdateProject:vscode.Event<Project> = this._onDidUpdateProject.event;
	
	private _onDidDeleteProject:vscode.EventEmitter<Project> = new vscode.EventEmitter<Project>();
	public readonly onDidDeleteProject:vscode.Event<Project> = this._onDidDeleteProject.event;
	
	private _onDidChangeProjects:vscode.EventEmitter<Project[]> = new vscode.EventEmitter<Project[]>();
	public readonly onDidChangeProjects:vscode.Event<Project[]> = this._onDidChangeProjects.event;
	
	public getProjectByPath (fsPath:string) {
		
		const projects = states.getProjects(this.context);
		
		return projects.find(({ path }) => path === fsPath) || null;
		
	}
	
	public async add (fsPath:string, value:string) {
		
		const projects = states.getProjects(this.context);
			
		addProject(projects, fsPath, value);
		
		states.updateProjects(this.context, projects);
		
		this._onDidChangeProjects.fire(projects);
		
	}
	
	public async addAll (uris:vscode.Uri[]) {
		
		const projects = states.getProjects(this.context);
		const length = projects.length;
		
		uris.forEach((uri) => {
			
			const fsPath = uri.fsPath;
			
			if (projects.some(({ path }) => path === fsPath)) return;
			
			addProject(projects, fsPath, formatLabel(fsPath));
			
		});
		
		if (projects.length === length) return;
		
		states.updateProjects(this.context, projects);
		
		this._onDidChangeProjects.fire(projects);
		
	}
	
	public update (favorite:Project) {
		
		const projects = states.getProjects(this.context);
		const fsPath = favorite.path;
		
		for (const project of projects) {
			if (project.path === fsPath) {
				project.label = favorite.label;
				projects.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
				states.updateProjects(this.context, projects);
				this._onDidChangeProjects.fire(projects);
				break;
			}
		}
		
	}
	
	public async rename (project:Project, label:string) {
		
		const projects = states.getProjects(this.context);
		const fsPath = project.path;
		
		for (const pro of projects) {
			if (pro.path === fsPath) {
				pro.label = label;
				projects.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
				states.updateProjects(this.context, projects);
				this._onDidUpdateProject.fire(pro);
				this._onDidChangeProjects.fire(projects);
				break;
			}
		}
		
		
	}
	
	public async remove (project:Project) {
		
		const projects = states.getProjects(this.context);
		const fsPath = project.path;
		
		for (let i = 0; i < projects.length; i++) {
			if (projects[i].path === fsPath) {
				projects.splice(i, 1);
				states.updateProjects(this.context, projects);
				if (project.color) settings.updateStatusBarColorSettings(project.path, colors[0]);
				this._onDidDeleteProject.fire(project);
				return;
			}
		}
		
	}
	
	public async clear () {
		
		states.updateProjects(this.context, []);
		this._onDidChangeProjects.fire([]);
		
	}
	
}

//	Functions __________________________________________________________________

function addProject (projects:Project[], fsPath:string, value:string) {
	
	const project:Project = {
		label: value,
		path: fsPath,
		type: settings.isCodeWorkspace(fsPath) ? 'folders' : 'folder',
	};
	
	projects.push(project);
	
	projects.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
	
}