//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { formatLabel } from '../@l13/formats';
import { isMacOs } from '../@l13/platforms';

import type { Project } from '../@types/workspaces';

import * as dialogs from '../common/dialogs';
import * as settings from '../common/settings';
import { getCurrentWorkspacePath } from '../common/workspaces';

import type { ProjectsState } from '../states/ProjectsState';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class ProjectsDialog {
	
	private static current:ProjectsDialog = null;
	
	public static create (projectsState:ProjectsState) {
		
		return ProjectsDialog.current || (ProjectsDialog.current = new ProjectsDialog(projectsState));
		
	}
	
	public constructor (private readonly projectsState:ProjectsState) {}
	
	public async addDirectory () {
		
		const uris = isMacOs ? await dialogs.open() : await dialogs.openFolder();
		
		if (!uris) return;
		
		this.projectsState.addAll(uris);
		
	}
	
	public async addVSCodeWorkspace () {
		
		const uris = await dialogs.openFile();
		
		if (!uris) return;
		
		this.projectsState.addAll(uris);
		
	}
	
	public async save (project?:Project) {
		
		const fsPath:string = project ? project.path : getCurrentWorkspacePath();
		
		if (fsPath) {
			const existingProject = this.projectsState.getByPath(fsPath);
			
			if (existingProject) {
				vscode.window.showInformationMessage(`Project "${existingProject.label}" exists!`);
				return;
			}
			
			const value = await vscode.window.showInputBox({
				value: formatLabel(fsPath),
				placeHolder: 'Please enter a name for the project',
			});
			
			if (!value) return;
			
			this.projectsState.add(fsPath, value);
		} else if (vscode.workspace.workspaceFile?.scheme === 'untitled') {
			vscode.window.showWarningMessage('Please save your current workspace first.');
			vscode.commands.executeCommand('workbench.action.saveWorkspaceAs');
		} else vscode.window.showErrorMessage('No folder or workspace available!');
		
	}
	
	public async rename (project:Project) {
		
		const value = await vscode.window.showInputBox({
			value: project.label,
			placeHolder: 'Please enter a new name for the project',
		});
		
		if (project.label === value || value === undefined) return;
		
		if (!value) {
			vscode.window.showErrorMessage('Project with no name is not valid!');
			return;
		}
		
		this.projectsState.rename(project, value);
		
	}
	
	public async remove (project:Project) {
		
		if (settings.get('confirmDeleteProject', true)) {
			const buttonDeleteDontShowAgain = 'Delete, don\'t show again';
			const value = await dialogs.confirm(`Delete project "${project.label}"?`, 'Delete', buttonDeleteDontShowAgain);
			if (!value) return;
			if (value === buttonDeleteDontShowAgain) settings.update('confirmDeleteProject', false);
		}
		
		this.projectsState.remove(project);
		
	}
	
	public async clear () {
		
		if (await dialogs.confirm('Delete all projects?', 'Delete')) {
			this.projectsState.clear();
		}
		
	}
	
}

//	Functions __________________________________________________________________

