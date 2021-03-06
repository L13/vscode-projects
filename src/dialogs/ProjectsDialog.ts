//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { formatLabel } from '../@l13/formats';
import { isMacOs } from '../@l13/platforms';

import { Project } from '../@types/workspaces';

import * as dialogs from '../common/dialogs';
import * as settings from '../common/settings';

import { ProjectsState } from '../states/ProjectsState';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class ProjectsDialog {
	
	private static currentProjectsDialog:ProjectsDialog = null;
	
	public static createProjectsDialog (states:ProjectsState) {
		
		return ProjectsDialog.currentProjectsDialog || (ProjectsDialog.currentProjectsDialog = new ProjectsDialog(states));
		
	}
	
	public constructor (private readonly states:ProjectsState) {}
	
	public async addProject () {
		
		const uris = isMacOs ? await dialogs.open() : await dialogs.openFolder();
		
		if (!uris) return;
		
		this.states.addProject(uris);
		
	}
	
	public async addProjectWorkspace () {
		
		const uris = await dialogs.openFile();
		
		if (!uris) return;
		
		this.states.addProject(uris);
		
	}
	
	public async saveProject (project?:Project) {
		
		const fsPath:string = project ? project.path : settings.getCurrentWorkspacePath();
		
		if (fsPath) {
			
			const existingProject = this.states.getProjectByPath(fsPath);
			
			if (existingProject) {
				return vscode.window.showErrorMessage(`Project "${existingProject.label}" exists!`);
			}
			
			const value = await vscode.window.showInputBox({
				value: formatLabel(fsPath),
				placeHolder: 'Please enter a name for the project',
			});
			
			if (!value) return;
			
			this.states.saveProject(fsPath, value);
			
		} else if (vscode.workspace.workspaceFile && vscode.workspace.workspaceFile.scheme === 'untitled') {
			vscode.window.showWarningMessage(`Please save your current workspace first.`);
			vscode.commands.executeCommand('workbench.action.saveWorkspaceAs');
		} else vscode.window.showErrorMessage(`No folder or workspace available!`);
		
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
		
		this.states.updateProject(project);
		
	}
	
	public async deleteProject (project:Project) {
		
		if (settings.get('confirmDeleteProject', true)) {
			const BUTTON_DELETE_DONT_SHOW_AGAIN = `Delete, don't show again`;
			const value = await dialogs.confirm(`Delete project "${project.label}"?`, 'Delete', BUTTON_DELETE_DONT_SHOW_AGAIN);
			if (!value) return;
			if (value === BUTTON_DELETE_DONT_SHOW_AGAIN) settings.update('confirmDeleteProject', false);
		}
		
		this.states.removeProject(project);
		
	}
	
	public async clearProjects () {
		
		if (await dialogs.confirm(`Delete all projects?'`, 'Delete')) {
			this.states.clearProjects();
		}
		
	}
	
}

//	Functions __________________________________________________________________

