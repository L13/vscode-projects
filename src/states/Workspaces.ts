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

export class Workspaces {
	
	private static _onDidUpdateProject:vscode.EventEmitter<Project> = new vscode.EventEmitter<Project>();
	public static readonly onDidUpdateProject:vscode.Event<Project> = Workspaces._onDidUpdateProject.event;
	
	private static _onDidChangeWorkspaces:vscode.EventEmitter<undefined> = new vscode.EventEmitter<undefined>();
	public static readonly onDidChangeWorkspaces:vscode.Event<undefined> = Workspaces._onDidChangeWorkspaces.event;
	
	public static async pickWorkspace (items:WorkspaceQuickPickItem[]) {
		
		const item = await vscode.window.showQuickPick(items, {
			placeHolder: 'Select a project',
		})
		
		if (item) {
			if (item.paths) files.openAll(item.paths);
			else files.open(item.description);
		}
		
	}
	
	public static async addProject (context:vscode.ExtensionContext) {
		
		const uris = isMacOs ? await dialogs.open() : await dialogs.openFolder();
		
		if (!uris) return;
		
		const projects = states.getProjects(context);
		const length = projects.length;
		
		uris.forEach((uri) => {
			
			const fsPath = uri.fsPath;
			
			if (projects.some(({ path }) => path === fsPath)) return;
			
			addProject(projects, fsPath, formatLabel(fsPath));
			
		});
		
		if (projects.length === length) return;
		
		states.updateProjects(context, projects);
		
		Workspaces._onDidChangeWorkspaces.fire();
		
	}
	
	public static async addProjectWorkspace (context:vscode.ExtensionContext) {
		
		const uris = await dialogs.openFile();
		
		if (!uris) return;
		
		const projects = states.getProjects(context);
		const length = projects.length;
		
		uris.forEach((uri) => {
			
			const fsPath = uri.fsPath;
			
			if (projects.some(({ path }) => path === fsPath)) return;
			
			addProject(projects, fsPath, formatLabel(fsPath));
			
		});
		
		if (projects.length === length) return;
		
		states.updateProjects(context, projects);
		
		Workspaces._onDidChangeWorkspaces.fire();
		
	}
	
	public static async saveProject (context:vscode.ExtensionContext, project?:Project) {
		
		const fsPath:string = project ? project.path : settings.getCurrentWorkspacePath();
		
		if (fsPath) {
			const projects = states.getProjects(context);
			
			if (projects.some(({ path }) => path === fsPath)) {
				return vscode.window.showErrorMessage(`Project exists!`);
			}
			
			const value = await vscode.window.showInputBox({
				value: formatLabel(fsPath),
				placeHolder: 'Please enter a name for the project',
			});
			
			if (!value) return;
			
			const newProject:Project = addProject(projects, fsPath, value);
			
			Workspaces._onDidUpdateProject.fire(newProject);
			states.updateProjects(context, projects);
			Workspaces._onDidChangeWorkspaces.fire();
			
		} else if (vscode.workspace.workspaceFile && vscode.workspace.workspaceFile.scheme === 'untitled') {
			vscode.window.showWarningMessage(`Please save your current workspace first.`);
			vscode.commands.executeCommand('workbench.action.saveWorkspaceAs');
		} else vscode.window.showErrorMessage(`No folder or workspace available!`);
		
	}
	
	public static updateProject (context:vscode.ExtensionContext, favorite:Project) {
		
		const projects = states.getProjects(context);
		
		for (const project of projects) {
			if (project.path === favorite.path && project.label !== favorite.label) {
				project.label = favorite.label;
				projects.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
				states.updateProjects(context, projects);
				Workspaces._onDidChangeWorkspaces.fire();
				break;
			}
		}
		
	}
	
	public static async renameProject (context:vscode.ExtensionContext, project:Project) {
		
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
		Workspaces.updateProject(context, project);
		Workspaces._onDidUpdateProject.fire(project);
		
	}
	
	public static async removeProject (context:vscode.ExtensionContext, project:Project) {
		
		if (await dialogs.confirm(`Delete project "${project.label}"?`, 'Delete')) {
			
			const projects = states.getProjects(context);
			const fsPath = project.path;
			
			for (let i = 0; i < projects.length; i++) {
				if (projects[i].path === fsPath) {
					projects.splice(i, 1);
					states.updateProjects(context, projects);
					if (project.color) settings.updateStatusBarColorSettings(project.path, colors[0]);
					Workspaces._onDidChangeWorkspaces.fire();
					project.removed = true;
					Workspaces._onDidUpdateProject.fire(project);
					return;
				}
			}
			
			vscode.window.showErrorMessage(`Project does not exist`);
		}
		
	}
	
	public static async clearProjects (context:vscode.ExtensionContext) {
		
		if (await dialogs.confirm(`Delete all projects?'`, 'Delete')) {
			states.updateProjects(context, []);
			Workspaces._onDidChangeWorkspaces.fire();
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