//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { ProjectsHotkeys } from '../services/common/ProjectsHotkeys';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function activate (context:vscode.ExtensionContext) {
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.assignSlot', async ({ project }) => ProjectsHotkeys.assignSlot(context, project)));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.removeSlot', () => ProjectsHotkeys.clearSlot(context)));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.clearSlots', () => ProjectsHotkeys.clearSlots(context)));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.slot1', () => ProjectsHotkeys.openSlot(context, 1)));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.slot2', () => ProjectsHotkeys.openSlot(context, 2)));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.slot3', () => ProjectsHotkeys.openSlot(context, 3)));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.slot4', () => ProjectsHotkeys.openSlot(context, 4)));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.slot5', () => ProjectsHotkeys.openSlot(context, 5)));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.slot6', () => ProjectsHotkeys.openSlot(context, 6)));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.slot7', () => ProjectsHotkeys.openSlot(context, 7)));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.slot8', () => ProjectsHotkeys.openSlot(context, 8)));
	
	context.subscriptions.push(vscode.commands.registerCommand('l13Projects.slot9', () => ProjectsHotkeys.openSlot(context, 9)));
	
}

//	Functions __________________________________________________________________

