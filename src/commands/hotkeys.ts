//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import * as commands from '../common/commands';

import { FavoritesProvider } from '../sidebar/FavoritesProvider';
import { WorkspacesProvider } from '../sidebar/WorkspacesProvider';

import { HotkeySlotsState } from '../states/HotkeySlotsState';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function activate (context:vscode.ExtensionContext) {
	
	const hotkeySlots = HotkeySlotsState.createHotkeySlotsState(context);
	
	context.subscriptions.push(hotkeySlots.onDidChangeSlots(() => {
		
		FavoritesProvider.currentFavoritesProvider?.refresh();
		WorkspacesProvider.currentWorkspacesProvider?.refresh();
		
	}));
	
	hotkeySlots.saveCurrentWorkspace();
	
	commands.register(context, {
		'l13Projects.action.workspace.assignSlot': async ({ project }) => hotkeySlots.assign(project),
		'l13Projects.action.workspaces.group.assignSlot': async ({ group }) => hotkeySlots.assignGroup(group),
		'l13Projects.action.workspace.removeSlot': () => hotkeySlots.clearSlot(),
		
		'l13Projects.action.hotkey.slot1': () => hotkeySlots.open(1),
		'l13Projects.action.hotkey.slot2': () => hotkeySlots.open(2),
		'l13Projects.action.hotkey.slot3': () => hotkeySlots.open(3),
		'l13Projects.action.hotkey.slot4': () => hotkeySlots.open(4),
		'l13Projects.action.hotkey.slot5': () => hotkeySlots.open(5),
		'l13Projects.action.hotkey.slot6': () => hotkeySlots.open(6),
		'l13Projects.action.hotkey.slot7': () => hotkeySlots.open(7),
		'l13Projects.action.hotkey.slot8': () => hotkeySlots.open(8),
		'l13Projects.action.hotkey.slot9': () => hotkeySlots.open(9),
		'l13Projects.action.hotkey.previousWorkspace': () => hotkeySlots.previousWorkspace(),
		
		'l13Projects.action.hotkeys.clearAllSlots': () => hotkeySlots.clear(),
	});
	
}

//	Functions __________________________________________________________________

