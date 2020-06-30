//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import * as commands from '../common/commands';

import { HotkeySlots } from '../features/HotkeySlots';
import { FavoritesProvider } from '../sidebar/FavoritesProvider';
import { WorkspacesProvider } from '../sidebar/WorkspacesProvider';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function activate (context:vscode.ExtensionContext) {
	
	const hotkeys = HotkeySlots.create(context);
	
	hotkeys.onDidChangeSlot(() => {
		
		FavoritesProvider.currentProvider?.refresh();
		WorkspacesProvider.currentProvider?.refresh();
		
	});
	
	commands.register(context, {
		'l13Projects.assignSlot': async ({ project }) => hotkeys.assign(project),
		'l13Projects.removeSlot': () => hotkeys.remove(),
		'l13Projects.clearSlots': () => hotkeys.clear(),
		'l13Projects.slot1': () => hotkeys.open(1),
		'l13Projects.slot2': () => hotkeys.open(2),
		'l13Projects.slot3': () => hotkeys.open(3),
		'l13Projects.slot4': () => hotkeys.open(4),
		'l13Projects.slot5': () => hotkeys.open(5),
		'l13Projects.slot6': () => hotkeys.open(6),
		'l13Projects.slot7': () => hotkeys.open(7),
		'l13Projects.slot8': () => hotkeys.open(8),
		'l13Projects.slot9': () => hotkeys.open(9),
		'l13Projects.previousWorkspace': () => hotkeys.previousWorkspace(),
	});
	
}

//	Functions __________________________________________________________________

