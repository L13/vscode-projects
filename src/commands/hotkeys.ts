//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import * as commands from '../common/commands';

import { HotkeySlotsDialog } from '../dialogs/HotkeySlotsDialog';

import { FavoritesProvider } from '../sidebar/FavoritesProvider';
import { WorkspacesProvider } from '../sidebar/WorkspacesProvider';

import { HotkeySlotsState } from '../states/HotkeySlotsState';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function activate (context:vscode.ExtensionContext) {
	
	const hotkeySlotsState = HotkeySlotsState.create(context);
	const hotkeySlotsDialog = HotkeySlotsDialog.create(hotkeySlotsState);
	
	context.subscriptions.push(hotkeySlotsState.onDidChangeSlots(() => {
		
		FavoritesProvider.current?.refresh();
		WorkspacesProvider.current?.refresh();
		
	}));
	
	hotkeySlotsState.saveCurrentWorkspace();
	
	commands.register(context, {
		'l13Projects.action.workspace.assignSlot': async ({ project }) => hotkeySlotsDialog.assignWorkspace(project),
		'l13Projects.action.workspaceGroups.assignSlot': async ({ group }) => hotkeySlotsDialog.assignGroup(group),
		'l13Projects.action.workspace.clearSlot': () => hotkeySlotsDialog.remove(),
		
		'l13Projects.action.hotkey.slot1': () => hotkeySlotsState.open(1),
		'l13Projects.action.hotkey.slot2': () => hotkeySlotsState.open(2),
		'l13Projects.action.hotkey.slot3': () => hotkeySlotsState.open(3),
		'l13Projects.action.hotkey.slot4': () => hotkeySlotsState.open(4),
		'l13Projects.action.hotkey.slot5': () => hotkeySlotsState.open(5),
		'l13Projects.action.hotkey.slot6': () => hotkeySlotsState.open(6),
		'l13Projects.action.hotkey.slot7': () => hotkeySlotsState.open(7),
		'l13Projects.action.hotkey.slot8': () => hotkeySlotsState.open(8),
		'l13Projects.action.hotkey.slot9': () => hotkeySlotsState.open(9),
		
		'l13Projects.action.hotkey.previousWorkspace': () => hotkeySlotsState.previousWorkspace(),
		
		'l13Projects.action.hotkeys.clearAllSlots': () => hotkeySlotsDialog.clear(),
	});
	
}

//	Functions __________________________________________________________________

