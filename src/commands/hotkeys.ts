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
	
	const hotkeySlots = HotkeySlots.create(context);
	
	hotkeySlots.onDidChangeSlot(() => {
		
		FavoritesProvider.currentProvider?.refresh();
		WorkspacesProvider.currentProvider?.refresh();
		
	});
	
	HotkeySlots.saveCurrentWorkspace(context);
	
	context.subscriptions.push(vscode.window.onDidChangeWindowState(({ focused }) => {
		
		if (focused) HotkeySlots.saveCurrentWorkspace(context);
		
	}));
	
	commands.register(context, {
		'l13Projects.assignSlot': async ({ project }) => hotkeySlots.assign(project),
		'l13Projects.removeSlot': () => hotkeySlots.remove(),
		'l13Projects.clearSlots': () => hotkeySlots.clear(),
		'l13Projects.slot1': () => hotkeySlots.open(1),
		'l13Projects.slot2': () => hotkeySlots.open(2),
		'l13Projects.slot3': () => hotkeySlots.open(3),
		'l13Projects.slot4': () => hotkeySlots.open(4),
		'l13Projects.slot5': () => hotkeySlots.open(5),
		'l13Projects.slot6': () => hotkeySlots.open(6),
		'l13Projects.slot7': () => hotkeySlots.open(7),
		'l13Projects.slot8': () => hotkeySlots.open(8),
		'l13Projects.slot9': () => hotkeySlots.open(9),
		'l13Projects.previousWorkspace': () => hotkeySlots.previousWorkspace(),
	});
	
}

//	Functions __________________________________________________________________

