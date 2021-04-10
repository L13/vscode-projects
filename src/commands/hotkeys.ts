//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import * as commands from '../common/commands';
import * as files from '../common/files';

import { HotkeySlotsDialog } from '../dialogs/HotkeySlotsDialog';
import { TagsDialog } from '../dialogs/TagsDialog';

import { FavoritesProvider } from '../sidebar/FavoritesProvider';
import { TagsProvider } from '../sidebar/TagsProvider';
import { WorkspacesProvider } from '../sidebar/WorkspacesProvider';

import { HotkeySlotsState } from '../states/HotkeySlotsState';
import { ProjectsState } from '../states/ProjectsState';
import { TagsState } from '../states/TagsState';
import { WorkspacesState } from '../states/WorkspacesState';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function activate (context:vscode.ExtensionContext) {
	
	const hotkeySlotsState = HotkeySlotsState.create(context);
	const projectsState = ProjectsState.create(context);
	const tagsState = TagsState.create(context);
	const workspacesState = WorkspacesState.create(context);
	
	const tagsDialog = TagsDialog.create(tagsState, workspacesState, projectsState);
	const hotkeySlotsDialog = HotkeySlotsDialog.create(hotkeySlotsState);
	
	context.subscriptions.push(hotkeySlotsState.onDidChangeSlots(() => {
		
		FavoritesProvider.current?.refresh();
		WorkspacesProvider.current?.refresh();
		TagsProvider.current?.refresh();
		
	}));
	
	hotkeySlotsState.saveCurrentWorkspace();
	
	commands.register(context, {
		'l13Projects.action.workspace.assignSlot': ({ project }) => hotkeySlotsDialog.assignWorkspace(project),
		'l13Projects.action.group.assignSlot': ({ group }) => hotkeySlotsDialog.assignGroup(group),
		'l13Projects.action.tag.assignSlot': ({ tag }) => hotkeySlotsDialog.assignTag(tag),
		'l13Projects.action.workspace.clearSlot': () => hotkeySlotsDialog.remove(),
		
		'l13Projects.action.hotkey.slot1': () => openSlot(hotkeySlotsState, tagsState, tagsDialog, 1),
		'l13Projects.action.hotkey.slot2': () => openSlot(hotkeySlotsState, tagsState, tagsDialog, 2),
		'l13Projects.action.hotkey.slot3': () => openSlot(hotkeySlotsState, tagsState, tagsDialog, 3),
		'l13Projects.action.hotkey.slot4': () => openSlot(hotkeySlotsState, tagsState, tagsDialog, 4),
		'l13Projects.action.hotkey.slot5': () => openSlot(hotkeySlotsState, tagsState, tagsDialog, 5),
		'l13Projects.action.hotkey.slot6': () => openSlot(hotkeySlotsState, tagsState, tagsDialog, 6),
		'l13Projects.action.hotkey.slot7': () => openSlot(hotkeySlotsState, tagsState, tagsDialog, 7),
		'l13Projects.action.hotkey.slot8': () => openSlot(hotkeySlotsState, tagsState, tagsDialog, 8),
		'l13Projects.action.hotkey.slot9': () => openSlot(hotkeySlotsState, tagsState, tagsDialog, 9),
		
		'l13Projects.action.hotkey.previousWorkspace': () => {
			
			const previousWorkspace = hotkeySlotsState.getPreviousWorkspace();
			
			if (previousWorkspace) files.open(previousWorkspace);
			
		},
		
		'l13Projects.action.hotkeys.clearAllSlots': () => hotkeySlotsDialog.clear(),
	});
	
}

//	Functions __________________________________________________________________

function openSlot (hotkeySlotsState:HotkeySlotsState, tagsState:TagsState, tagsDialog:TagsDialog, index:number) {
	
	const slots = hotkeySlotsState.get();
	const slot = slots[index];
	
	if (slot) {
		if ('tagId' in slot) tagsDialog.open(tagsState.getById(slot.tagId));
		else if ('groupId' in slot) files.openAll(slot.paths);
		else files.open(slot.path);
		
	}
	
}