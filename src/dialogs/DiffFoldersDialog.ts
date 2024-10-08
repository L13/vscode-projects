//	Imports ____________________________________________________________________

import * as path from 'path';
import * as vscode from 'vscode';

import { sortCaseInsensitive } from '../@l13/arrays';

import * as files from '../common/files';
import * as fse from '../common/fse';
import { parsePredefinedVariable } from '../common/paths';
import * as settings from '../common/settings';
import * as terminal from '../common/terminal';

import { ProjectsState } from '../states/ProjectsState';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class DiffFoldersDialog {
	
	private static current: DiffFoldersDialog = null;
	
	public static create (projectsState: ProjectsState) {
		
		return DiffFoldersDialog.current || (DiffFoldersDialog.current = new DiffFoldersDialog(projectsState));
		
	}
	
	private constructor (private readonly projectsState: ProjectsState) {}
	
	public async reveal (paths: string[]) {
		
		const items = await this.createQuickPickItems(paths);
		
		if (!items.length) return;
		
		if (items.length > 1) {
			const selectedItem = await vscode.window.showQuickPick(items, {
				placeHolder: 'Please select a workspace',
			});
			
			if (selectedItem) files.reveal(selectedItem.workspace.path);
		} else files.reveal(items[0].workspace.path);
		
	}
	
	public async openInTerminal (paths: string[]) {
		
		const items = await this.createQuickPickItems(paths);
		
		if (!items.length) return;
		
		if (items.length > 1) {
			const selectedItem = await vscode.window.showQuickPick(items, {
				placeHolder: 'Please select a workspace',
			});
			
			if (selectedItem) terminal.open(selectedItem.workspace.path);
		} else terminal.open(items[0].workspace.path);
		
	}
	
	public async openWorkspace (paths: string[]) {
		
		const items = await this.createQuickPickItems(paths);
		
		if (!items.length) return;
		
		if (items.length > 1) {
			const both = {
				label: 'Open Both Workspaces',
				description: '',
				workspace: { path: '' },
			};
			const newWindow = settings.openInNewWindow();
			const placeHolder = `Select a workspace and open it in ${newWindow ? 'a new' : 'the current'} window`;
			const selectedItem = await vscode.window.showQuickPick([both, ...items], { placeHolder });
			
			if (selectedItem) {
				if (selectedItem === both) files.openAll(paths);
				else files.open(selectedItem.workspace.path);
			}
		} else files.open(items[0].workspace.path);
		
	}
	
	private async createQuickPickItems (paths: string[]) {
		
		const parsedPaths = paths.map((fsPath) => {
		
			return parsePredefinedVariable(fsPath);
		
		});
		
		const filteredPaths = [];
		
		for (const fsPath of parsedPaths) {
			if (await fse.exists(fsPath)) filteredPaths.push(fsPath);
		}
		
		return filteredPaths
			.map((fsPath) => {
				
				const project = this.projectsState.getByPath(fsPath);
			
				return {
					label: project?.label || path.basename(fsPath),
					description: project?.path || fsPath,
					workspace: project || { path: fsPath },
				};
				
			})
			.sort(({ label: a }, { label: b }) => sortCaseInsensitive(a, b));
		
	}
	
}

//	Functions __________________________________________________________________

