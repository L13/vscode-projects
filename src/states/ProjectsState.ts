//	Imports ____________________________________________________________________

import * as fs from 'fs';
import * as vscode from 'vscode';

import { sortCaseInsensitive } from '../@l13/arrays';
import { formatLabel } from '../@l13/formats';

import type { Project } from '../@types/workspaces';

import * as states from '../common/states';
import { isCodeWorkspace } from '../common/workspaces';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class ProjectsState {
	
	private static current:ProjectsState = null;
	
	public static create (context:vscode.ExtensionContext) {
		
		return ProjectsState.current || (ProjectsState.current = new ProjectsState(context));
		
	}
	
	public constructor (private readonly context:vscode.ExtensionContext) {}
	
	private _onDidUpdateProject:vscode.EventEmitter<Project> = new vscode.EventEmitter<Project>();
	public readonly onDidUpdateProject:vscode.Event<Project> = this._onDidUpdateProject.event;
	
	private _onDidDeleteProject:vscode.EventEmitter<Project> = new vscode.EventEmitter<Project>();
	public readonly onDidDeleteProject:vscode.Event<Project> = this._onDidDeleteProject.event;
	
	private _onDidChangeProjects:vscode.EventEmitter<Project[]> = new vscode.EventEmitter<Project[]>();
	public readonly onDidChangeProjects:vscode.Event<Project[]> = this._onDidChangeProjects.event;
	
	public get () {
		
		return states.getProjects(this.context);
		
	}
	
	private save (projects:Project[]) {
		
		states.updateProjects(this.context, projects);
		
	}
	
	public detectProjectsExists () {
		
		const projects = this.get();
		
		projects.forEach((project) => project.deleted = !fs.existsSync(project.path));
		
		states.updateProjects(this.context, projects);
		
	}
	
	public removeDeletedProjects () {
		
		let projects = this.get();
		const length = projects.length;
		
		projects = projects.filter((project) => fs.existsSync(project.path));
		
		if (length !== projects.length) {
			states.updateProjects(this.context, projects);
			this.save(projects);
			// this._onDidChangeProjects.fire(projects);
		}
		
	}
	
	public getByPath (fsPath:string) {
		
		const projects = this.get();
		
		return projects.find(({ path }) => path === fsPath) || null;
		
	}
	
	public add (fsPath:string, label:string) {
		
		const projects = this.get();
		
		for (const project of projects) {
			if (project.path === fsPath) return;
		}
			
		addProject(projects, fsPath, label);
		
		this.save(projects);
		this._onDidChangeProjects.fire(projects);
		
	}
	
	public addAll (uris:vscode.Uri[]) {
		
		const projects = this.get();
		const length = projects.length;
		
		uris.forEach((uri) => {
			
			const fsPath = uri.fsPath;
			
			if (projects.some(({ path }) => path === fsPath)) return;
			
			addProject(projects, fsPath, formatLabel(fsPath));
			
		});
		
		if (projects.length === length) return;
		
		this.save(projects);
		
		this._onDidChangeProjects.fire(projects);
		
	}
	
	public update (favorite:Project) {
		
		const projects = this.get();
		const fsPath = favorite.path;
		
		for (const project of projects) {
			if (project.path === fsPath) {
				project.label = favorite.label;
				projects.sort(({ label: a }, { label: b }) => sortCaseInsensitive(a, b));
				this.save(projects);
				this._onDidChangeProjects.fire(projects);
				break;
			}
		}
		
	}
	
	public rename (project:Project, label:string) {
		
		const projects = this.get();
		const fsPath = project.path;
		
		for (const pro of projects) {
			if (pro.path === fsPath) {
				pro.label = label;
				projects.sort(({ label: a }, { label: b }) => sortCaseInsensitive(a, b));
				this.save(projects);
				this._onDidUpdateProject.fire(pro);
				this._onDidChangeProjects.fire(projects);
				break;
			}
		}
		
		
	}
	
	public remove (project:Project) {
		
		const projects = this.get();
		const fsPath = project.path;
		
		for (let i = 0; i < projects.length; i++) {
			if (projects[i].path === fsPath) {
				projects.splice(i, 1);
				this.save(projects);
				this._onDidDeleteProject.fire(project);
				break;
			}
		}
		
	}
	
	public clear () {
		
		this.save([]);
		this._onDidChangeProjects.fire([]);
		
	}
	
}

//	Functions __________________________________________________________________

function addProject (projects:Project[], path:string, label:string) {
	
	const project:Project = {
		label,
		path,
		type: isCodeWorkspace(path) ? 'folders' : 'folder',
	};
	
	projects.push(project);
	
	projects.sort(({ label: a }, { label: b }) => sortCaseInsensitive(a, b));
	
}