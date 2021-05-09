//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import type { Tag } from '../@types/tags';
import type { Project } from '../@types/workspaces';

import { sortCaseInsensitive } from '../@l13/arrays';
import { formatAmount, formatLabel } from '../@l13/formats';
import { pluralWorkspaces } from '../@l13/units/projects';

import * as dialogs from '../common/dialogs';
import * as files from '../common/files';
import * as settings from '../common/settings';

import type { ProjectsState } from '../states/ProjectsState';
import type { TagsState } from '../states/TagsState';
import type { WorkspacesState } from '../states/WorkspacesState';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class TagsDialog {
	
	private static current:TagsDialog = null;
	
	public static create (tagsState:TagsState, workspacesState:WorkspacesState, projectsState:ProjectsState) {
		
		return TagsDialog.current || (TagsDialog.current = new TagsDialog(tagsState, workspacesState, projectsState));
		
	}
	
	public constructor (private readonly tagsState:TagsState, private readonly workspacesState:WorkspacesState, private readonly projectsState:ProjectsState) {}
	
	public async add () {
		
		const label = await vscode.window.showInputBox({
			placeHolder: 'Please enter a name for the tag.',
		});
		
		if (!label) return;
		
		if (this.tagsState.getByName(label)) {
			vscode.window.showInformationMessage(`Tag with the name "${label}" exists!`);
			return;
		}
		
		this.tagsState.add(label);
		
		return this.tagsState.getByName(label);
		
	}
	
	public async open (tag:Tag, openInNewWindow?:boolean) {
		
		if (tag.paths.length) {
			const items = tag.paths.map((path) => {
			
				const project = this.projectsState.getByPath(path);
				
				return {
					label: project?.label || formatLabel(path),
					description: project?.path || path,
					detail: project?.deleted ? '$(alert) Path does not exist' : '',
					workspace: project || { path },
				};
				
			}).sort(({ label: a }, { label: b }) => sortCaseInsensitive(a, b));
			const newWindow = openInNewWindow ?? settings.openInNewWindow();
			const placeHolder = `Select a workspace from "${tag.label}" and open it in ${newWindow ? 'a new' : 'the current'} window`;
			const selectedItem = await vscode.window.showQuickPick(items, { placeHolder });
			if (selectedItem) files.open(selectedItem.workspace.path, openInNewWindow);
		} else this.editWorkspaces(tag);
		
	}
	
	public async pick () {
		
		const tags = this.tagsState.get();
		
		if (!tags.length) return;
		
		const items = tags.map((tag) => {
			
			return {
				label: `$(tag) ${tag.label}`,
				description: tag.paths.length ? formatAmount(tag.paths.length, pluralWorkspaces) : '',
				tag,
			};
			
		});
		
		const selectedItem = await vscode.window.showQuickPick(items, {
			placeHolder: 'Select a tag',
		});
		
		if (!selectedItem) return;
		
		this.open(selectedItem.tag);
		
	}
	
	public async editWorkspaces (tag:Tag) {
		
		const workspaces = this.workspacesState.cache || await this.workspacesState.detect();
		
		if (!workspaces.length) return;
		
		const items = workspaces.map((workspace) => {
			
			return {
				label: workspace.label,
				description: workspace.path,
				detail: workspace.deleted ? '$(alert) Path does not exist' : '',
				picked: tag.paths.includes(workspace.path),
				workspace,
			};
			
		});
		
		const selectedItems = await vscode.window.showQuickPick(items, {
			placeHolder: `Please select workspaces for "${tag.label}"`,
			canPickMany: true,
		});
		
		if (!selectedItems) return;
		
		this.tagsState.editWorkspaces(tag, selectedItems.map((item) => item.workspace));
		
	}
	
	public async editTags (workspace:Project) {
		
		const tags = this.tagsState.get();
		let selectedTags:Tag[] = null;
		
		if (tags.length) {
			const items = tags.map((tag) => {
				
				return {
					label: `$(tag) ${tag.label}`,
					picked: tag.paths.includes(workspace.path),
					tag,
				};
				
			});
			const selectedItems = await vscode.window.showQuickPick(items, {
				placeHolder: `Please select tags for "${workspace.label}"`,
				canPickMany: true,
			});
			
			if (!selectedItems) return;
			
			selectedTags = selectedItems.map((item) => item.tag);
		} else {
			const tag = await this.add();
			if (tag) selectedTags = [tag];
		}
		
		if (!selectedTags) return;
		
		this.tagsState.editTags(workspace, selectedTags);
		
	}
	
	public async rename (tag:Tag) {
		
		const label = await vscode.window.showInputBox({
			placeHolder: 'Please enter a new name for the tag.',
			value: tag.label,
		});
		
		if (!label || tag.label === label) return;
		
		if (this.tagsState.getByName(label)) {
			vscode.window.showErrorMessage(`Tag with name "${label}" exists!`);
			return;
		}
		
		this.tagsState.rename(tag, label);
		
	}
	
	public async remove (tag:Tag) {
		
		if (settings.get('confirmDeleteTag', true)) {
			const buttonDeleteDontShowAgain = 'Delete, don\'t show again';
			const value = await dialogs.confirm(`Delete tag "${tag.label}"?`, 'Delete', buttonDeleteDontShowAgain);
			if (!value) return;
			if (value === buttonDeleteDontShowAgain) settings.update('confirmDeleteTag', false);
		}
		
		this.tagsState.remove(tag);
		
	}
	
	public async clear () {
		
		if (await dialogs.confirm('Delete all tags?', 'Delete')) {
			this.tagsState.clear();
		}
		
	}
	
}

//	Functions __________________________________________________________________

