//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { Commands } from '../services/common/Commands';
import { Hotkeys } from '../services/common/Hotkeys';
import { FavoritesProvider } from '../services/sidebar/FavoritesProvider';
import { WorkspacesProvider } from '../services/sidebar/WorkspacesProvider';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function activate (context:vscode.ExtensionContext) {
	
	Hotkeys.onDidChangeSlot(() => {
		
		FavoritesProvider.currentProvider?.refresh();
		WorkspacesProvider.currentProvider?.refresh();
		
	});
	
	Commands.register(context, {
		'l13Projects.assignSlot': async ({ project }) => Hotkeys.assignSlot(context, project),
		'l13Projects.removeSlot': () => Hotkeys.clearSlot(context),
		'l13Projects.clearSlots': () => Hotkeys.clearSlots(context),
		'l13Projects.slot1': () => Hotkeys.openSlot(context, 1),
		'l13Projects.slot2': () => Hotkeys.openSlot(context, 2),
		'l13Projects.slot3': () => Hotkeys.openSlot(context, 3),
		'l13Projects.slot4': () => Hotkeys.openSlot(context, 4),
		'l13Projects.slot5': () => Hotkeys.openSlot(context, 5),
		'l13Projects.slot6': () => Hotkeys.openSlot(context, 6),
		'l13Projects.slot7': () => Hotkeys.openSlot(context, 7),
		'l13Projects.slot8': () => Hotkeys.openSlot(context, 8),
		'l13Projects.slot9': () => Hotkeys.openSlot(context, 9),
	});
	
}

//	Functions __________________________________________________________________

