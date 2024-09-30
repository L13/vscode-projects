//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import type { Project } from '../@types/workspaces';

import { sortCaseInsensitive } from '../@l13/arrays';
import { formatLabel } from '../@l13/formats';

import * as fse from '../common/fse';
import * as states from '../common/states';
import { getPath } from '../common/uris';
import { createWorkspaceItem } from '../common/workspaces';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class ProjectsState {
	
	private static current: ProjectsState = null;
	
	public static create (context: vscode.ExtensionContext) {
		
		return ProjectsState.current || (ProjectsState.current = new ProjectsState(context));
		
	}
	
	private constructor (private readonly context: vscode.ExtensionContext) {}
	
	private _onDidUpdateProject: vscode.EventEmitter<Project> = new vscode.EventEmitter<Project>();
	public readonly onDidUpdateProject: vscode.Event<Project> = this._onDidUpdateProject.event;
	
	private _onDidDeleteProject: vscode.EventEmitter<Project> = new vscode.EventEmitter<Project>();
	public readonly onDidDeleteProject: vscode.Event<Project> = this._onDidDeleteProject.event;
	
	private _onDidChangeProjects: vscode.EventEmitter<Project[]> = new vscode.EventEmitter<Project[]>();
	public readonly onDidChangeProjects: vscode.Event<Project[]> = this._onDidChangeProjects.event;
	
	public get () {
		
		return states.getProjects(this.context);
		
	}
	
	private save (projects: Project[]) {
		
		states.updateProjects(this.context, projects);
		
	}
	
	public async detectProjectsExists () {
		
		const projects = this.get();
		
		for (const project of projects) {
			project.deleted = ProjectsState.isLocalProject(project) ? !await fse.exists(project.path) : false;
		}
		
		states.updateProjects(this.context, projects);
		
	}
	
	public async removeDeletedProjects () {
		
		const projects = this.get();
		const length = projects.length;
		const filteredProjects = [];
		
		for (const project of projects) {
			if (ProjectsState.isLocalProject(project)) {
				if (await fse.exists(project.path)) filteredProjects.push(project);
			}
		}
		
		if (length !== filteredProjects.length) {
			states.updateProjects(this.context, filteredProjects);
			this.save(filteredProjects);
			// this._onDidChangeProjects.fire(filteredProjects);
		}
		
	}
	
	public getByPath (path: string) {
		
		const projects = this.get();
		
		return projects.find((project) => project.path === path) || null;
		
	}
	
	public add (path: string, label: string) {
		
		const projects = this.get();
		
		for (const project of projects) {
			if (project.path === path) return;
		}
			
		const newProject = createProject(projects, path, label);
		
		sortProjects(projects);
		
		this.save(projects);
		
		this._onDidUpdateProject.fire(newProject);
		this._onDidChangeProjects.fire(projects);
		
	}
	
	public addAll (uris: vscode.Uri[]) {
		
		const projects = this.get();
		const length = projects.length;
		
		uris.forEach((uri) => {
			
			const path = getPath(uri);
			
			if (projects.some((project) => project.path === path)) return;
			
			const newProject = createProject(projects, path, formatLabel(path));
			
			this._onDidUpdateProject.fire(newProject);
			
		});
		
		if (projects.length === length) return;
		
		sortProjects(projects);
		
		this.save(projects);
		
		this._onDidChangeProjects.fire(projects);
		
	}
	
	public update (selectedFavorite: Project) {
		
		const projects = this.get();
		const path = selectedFavorite.path;
		
		for (const project of projects) {
			if (project.path === path) {
				project.label = selectedFavorite.label;
				sortProjects(projects);
				this.save(projects);
				this._onDidChangeProjects.fire(projects);
				break;
			}
		}
		
	}
	
	public rename (selectedProject: Project, label: string) {
		
		const projects = this.get();
		const path = selectedProject.path;
		
		for (const project of projects) {
			if (project.path === path) {
				project.label = label;
				sortProjects(projects);
				this.save(projects);
				this._onDidUpdateProject.fire(project);
				this._onDidChangeProjects.fire(projects);
				break;
			}
		}
		
		
	}
	
	public remove (project: Project) {
		
		const projects = this.get();
		const path = project.path;
		
		for (let i = 0; i < projects.length; i++) {
			if (projects[i].path === path) {
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
	
	public static isLocalProject (project: Project) {
		
		return project.type === 'folder' || project.type === 'folders';
		
	}
	
}

//	Functions __________________________________________________________________

function createProject (projects: Project[], path: string, label: string) {
	
	const project = createWorkspaceItem(path, null, label);
	
	projects.push(project);
	
	return project;
	
}

function sortProjects (projects: Project[]) {
	
	return projects.sort(({ label: a }, { label: b }) => sortCaseInsensitive(a, b));
	
}