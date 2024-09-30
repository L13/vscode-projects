//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import * as commands from '../common/commands';
import * as settings from '../common/settings';

import { TagsDialog } from '../dialogs/TagsDialog';

import { TagsProvider } from '../sidebar/TagsProvider';
import { TagTreeItem } from '../sidebar/trees/items/TagTreeItem';

import { HotkeySlotsState } from '../states/HotkeySlotsState';
import { ProjectsState } from '../states/ProjectsState';
import { TagsState } from '../states/TagsState';
import { WorkspacesState } from '../states/WorkspacesState';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function activate (context: vscode.ExtensionContext) {
	
	const subscriptions = context.subscriptions;
	
	const hotkeySlotsState = HotkeySlotsState.create(context);
	const projectsState = ProjectsState.create(context);
	const tagsState = TagsState.create(context);
	const workspacesState = WorkspacesState.create(context);
	
	const tagsDialog = TagsDialog.create(tagsState, workspacesState, projectsState);
	
	const tagsProvider = TagsProvider.create({
		tags: tagsState.get(),
		hotkeySlots: hotkeySlotsState,
	});
	
	const treeView = vscode.window.createTreeView('l13ProjectsTags', {
		treeDataProvider: tagsProvider,
	});
	
//	Tree View
	
	subscriptions.push(treeView);
	
//	Workspaces Provider
		
	subscriptions.push(vscode.workspace.onDidChangeConfiguration((event) => {
		
		if (event.affectsConfiguration('l13Projects.tagDescriptionFormat')) {
			tagsProvider.tagDescriptionFormat = settings.get('tagDescriptionFormat');
			tagsProvider.refresh();
		}
		
	}));
	
//	Tags
	
	subscriptions.push(tagsState.onDidUpdateTag((tag) => {
		
		hotkeySlotsState.updateTag(tag);
		
	}));
	
	subscriptions.push(tagsState.onDidDeleteTag((tag) => {
		
		hotkeySlotsState.removeTag(tag);
		
	}));
	
	subscriptions.push(tagsState.onDidChangeTags((tags) => {
		
		tagsProvider.refresh({ tags });
		
	}));
	
//	Commands
	
	commands.register(context, {
		'l13Projects.action.tag.add': () => tagsDialog.add(),
		'l13Projects.action.tag.editWorkspaces': ({ tag }: TagTreeItem) => tagsDialog.editWorkspaces(tag),
		'l13Projects.action.tag.pickAndOpen': ({ tag }: TagTreeItem) => tagsDialog.open(tag),
		'l13Projects.action.tag.pickAndOpenInCurrentWindow': ({ tag }: TagTreeItem) => tagsDialog.open(tag, false),
		'l13Projects.action.tag.pickAndOpenInNewWindow': ({ tag }: TagTreeItem) => tagsDialog.open(tag, true),
		'l13Projects.action.tag.pickTag': () => tagsDialog.pick(),
		'l13Projects.action.tag.rename': ({ tag }: TagTreeItem) => tagsDialog.rename(tag),
		'l13Projects.action.tag.remove': ({ tag }: TagTreeItem) => tagsDialog.remove(tag),
		
		'l13Projects.action.tags.clear': () => tagsDialog.clear(),
	});
	
}

//	Functions __________________________________________________________________

