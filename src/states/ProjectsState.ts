//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { sortCaseInsensitive } from '../@l13/arrays';
import { formatLabel } from '../@l13/formats';
import { isMacOs } from '../@l13/platforms';

import { Project, WorkspaceQuickPickItem } from '../@types/workspaces';

import * as dialogs from '../common/dialogs';
import * as files from '../common/files';
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
	
	private _onDidChangeWorkspaces:vscode.EventEmitter<undefined> = new vscode.EventEmitter<undefined>();
	public readonly onDidChangeWorkspaces:vscode.Event<undefined> = this._onDidChangeWorkspaces.event;
	
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
		
		this._onDidChangeWorkspaces.fire();
		
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
		
		this._onDidChangeWorkspaces.fire();
		
	}
	
	public async saveProject (project?:Project) {
		
		const fsPath:string = project ? project.path : settings.getCurrentWorkspacePath();
		
		if (fsPath) {
			const projects = states.getProjects(this.context);
			
			if (projects.some(({ path }) => path === fsPath)) {
				return vscode.window.showErrorMessage(`Project exists!`);
			}
			
			const value = await vscode.window.showInputBox({
				value: formatLabel(fsPath),
				placeHolder: 'Please enter a name for the project',
			});
			
			if (!value) return;
			
			const newProject:Project = addProject(projects, fsPath, value);
			
			states.updateProjects(this.context, projects);
			
			this._onDidUpdateProject.fire(newProject);
			this._onDidChangeWorkspaces.fire();
			
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
				this._onDidChangeWorkspaces.fire();
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
		
		if (await dialogs.confirm(`Delete project "${project.label}"?`, 'Delete')) {
			
			const projects = states.getProjects(this.context);
			const fsPath = project.path;
			
			for (let i = 0; i < projects.length; i++) {
				if (projects[i].path === fsPath) {
					projects.splice(i, 1);
					states.updateProjects(this.context, projects);
					if (project.color) settings.updateStatusBarColorSettings(project.path, colors[0]);
					this._onDidChangeWorkspaces.fire();
					this._onDidDeleteProject.fire(project);
					return;
				}
			}
			
			vscode.window.showErrorMessage(`Project does not exist`);
		}
		
	}
	
	public async clearProjects () {
		
		if (await dialogs.confirm(`Delete all projects?'`, 'Delete')) {
			states.updateProjects(this.context, []);
			this._onDidChangeWorkspaces.fire();
		}
		
	}
	
}

//	Functions __________________________________________________________________

function addProject (projects:Project[], fsPath:string, value:string) :Project {
	
	const project:Project = {
		label: value,
		path: fsPath,
		type: settings.isCodeWorkspace(fsPath) ? 'folders' : 'folder',
	};
	
	projects.push(project);
	
	projects.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
	
	return project;
	
}