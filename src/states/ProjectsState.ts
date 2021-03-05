//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { sortCaseInsensitive } from '../@l13/arrays';
import { formatLabel } from '../@l13/formats';
import { isMacOs } from '../@l13/platforms';

import { Project } from '../@types/workspaces';

import * as dialogs from '../common/dialogs';
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
	
	public async addProject () {
		
		const uris = isMacOs ? await dialogs.open() : await dialogs.openFolder();
		
		if (!uris) return;
		
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
	
	public async addProjectWorkspace () {
		
		const uris = await dialogs.openFile();
		
		if (!uris) return;
		
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
	
	public async saveProject (project?:Project) {
		
		const fsPath:string = project ? project.path : settings.getCurrentWorkspacePath();
		
		if (fsPath) {
			const projects = states.getProjects(this.context);
			const existingProject = projects.find(({ path }) => path === fsPath);
			
			if (existingProject) {
				return vscode.window.showErrorMessage(`Project "${existingProject.label}" exists!`);
			}
			
			const value = await vscode.window.showInputBox({
				value: formatLabel(fsPath),
				placeHolder: 'Please enter a name for the project',
			});
			
			if (!value) return;
			
			addProject(projects, fsPath, value);
			
			states.updateProjects(this.context, projects);
			
			this._onDidChangeProjects.fire(projects);
			
		} else if (vscode.workspace.workspaceFile && vscode.workspace.workspaceFile.scheme === 'untitled') {
			vscode.window.showWarningMessage(`Please save your current workspace first.`);
			vscode.commands.executeCommand('workbench.action.saveWorkspaceAs');
		} else vscode.window.showErrorMessage(`No folder or workspace available!`);
		
	}
	
	public updateProject (favorite:Project) {
		
		const projects = states.getProjects(this.context);
		
		for (const project of projects) {
			if (project.path === favorite.path && project.label !== favorite.label) {
				project.label = favorite.label;
				projects.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
				states.updateProjects(this.context, projects);
				this._onDidChangeProjects.fire(projects);
				break;
			}
		}
		
	}
	
	public async renameProject (project:Project) {
		
		const value = await vscode.window.showInputBox({
			value: project.label,
			placeHolder: 'Please enter a new name for the project',
		});
		
		if (project.label === value || value === undefined) return;
		
		if (!value) {
			vscode.window.showErrorMessage(`Project with no name is not valid!`);
			return;
		}
		
		project.label = value;
		
		this.updateProject(project);
		
		this._onDidUpdateProject.fire(project);
		
	}
	
	public async removeProject (project:Project) {
		
		if (settings.get('confirmDeleteProject', true)) {
			const BUTTON_DELETE_DONT_SHOW_AGAIN = `Delete, don't show again`;
			const value = await dialogs.confirm(`Delete project "${project.label}"?`, 'Delete', BUTTON_DELETE_DONT_SHOW_AGAIN);
			if (!value) return;
			if (value === BUTTON_DELETE_DONT_SHOW_AGAIN) settings.update('confirmDeleteProject', false);
		}
		
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
	
	public async clearProjects () {
		
		if (await dialogs.confirm(`Delete all projects?'`, 'Delete')) {
			states.updateProjects(this.context, []);
			this._onDidChangeProjects.fire([]);
		}
		
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