//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { sortCaseInsensitive } from '../@l13/arrays';
import { formatLabel } from '../@l13/formats';

import * as files from '../common/files';
import * as settings from '../common/settings';

import { ProjectsState } from '../states/ProjectsState';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class DiffFoldersDialog {
	
	private static current:DiffFoldersDialog = null;
	
	public static create (projectsState:ProjectsState) {
		
		return DiffFoldersDialog.current || (DiffFoldersDialog.current = new DiffFoldersDialog(projectsState));
		
	}
	
	public constructor (private readonly projectsState:ProjectsState) {}
	
	public async openWorkspace (paths:string[]) {
		
		const both = {
			label: 'Open Both',
			description: '',
			workspace: { path: '' },
		};
		const items = [both, ...this.createQuickPickItems(paths)];
		const newWindow = settings.openInNewWindow();
		const placeHolder = `Select a workspace and open it in ${newWindow ? 'a new' : 'the current'} window`;
		const selectedItem = await vscode.window.showQuickPick(items, { placeHolder });
		
		if (selectedItem) {
			if (selectedItem === both) files.openAll(paths);
			else files.open(selectedItem.workspace.path);
		}
		
	}
	
	private createQuickPickItems (paths:string[]) {
		
		return paths.map((path) => {
		
			const project = this.projectsState.getByPath(path);
			
			return {
				label: project?.label || formatLabel(path),
				description: project?.path || path,
				workspace: project || { path },
			};
			
		}).sort(({ label:a }, { label:b }) => sortCaseInsensitive(a, b));
		
	}
	
}

//	Functions __________________________________________________________________

