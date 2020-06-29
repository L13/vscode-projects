//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { Item, Slot } from '../@types/hotkeys';
import { Project } from '../@types/projects';
import { Open } from '../actions/Open';

//	Variables __________________________________________________________________

const SLOTS = 'slots';

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class Hotkeys {
	
	private static _onDidChangeSlot:vscode.EventEmitter<Slot[]> = new vscode.EventEmitter<Slot[]>();
	public static readonly onDidChangeSlot:vscode.Event<Slot[]> = Hotkeys._onDidChangeSlot.event;
	
	private static slots:Slot[]|null = null;
	
	public static async assignSlot (context:vscode.ExtensionContext, project:Project) {
		
		const slots = Hotkeys.slots || Hotkeys.getSlots(context);
		const items:Item[] = [];
		
		for (let i = 1; i < 10; i++) {
			items.push({
				label: `Slot ${i}`,
				index: i,
				description: slots[i]?.label || '',
			});
		}
		
		const item = await vscode.window.showQuickPick(items, {
			placeHolder: 'Please select a slot for the workspace.',
		});
		
		if (item) {
			for (const slot of slots) {
				if (slot?.path === project.path) delete slots[slot.index];
			}
			slots[item.index] = {
				label: project.label,
				index: item.index,
				path: project.path,
			};
			context.globalState.update(SLOTS, slots);
			Hotkeys._onDidChangeSlot.fire(slots);
		}
		
	}
	
	public static openSlot (context:vscode.ExtensionContext, index:number) {
		
		const slots = Hotkeys.slots || Hotkeys.getSlots(context);
		const slot = slots[index];
		
		if (slot) Open.openFolder(slot.path);
	}
	
	public static updateSlot (context:vscode.ExtensionContext, project:Project) {
		
		const slots = Hotkeys.slots || Hotkeys.getSlots(context);
		
		for (const slot of slots) {
			if (slot?.path === project.path) slots[slot.index].label = project.label;
		}
		
		context.globalState.update(SLOTS, slots);
		Hotkeys._onDidChangeSlot.fire(slots);
		
	}
	
	public static async clearSlot (context:vscode.ExtensionContext) {
		
		const slots = Hotkeys.slots || Hotkeys.getSlots(context);
		const items:Item[] = [];
		
		for (const slot of slots) {
			if (slot) {
				items.push({
					label: `Slot ${slot.index}`,
					index: slot.index,
					description: slot.label || '',
				});
			}
		}
		
		const item = await vscode.window.showQuickPick(items, {
			placeHolder: 'Please select the slot which should be cleared.',
		});
		
		if (item) {
			delete slots[item.index];
			context.globalState.update(SLOTS, slots);
			Hotkeys._onDidChangeSlot.fire(slots);
		}
		
	}
	
	public static getSlots (context:vscode.ExtensionContext) {
		
		return Hotkeys.slots || (Hotkeys.slots = context.globalState.get(SLOTS, []));
		
	}
	
	public static getSlot (context:vscode.ExtensionContext, project:Project) {
		
		const slots = Hotkeys.slots || Hotkeys.getSlots(context);
		
		for (const slot of slots) {
			if (slot?.path === project.path) return slot;
		}
		
		return null;
		
	}
	
	public static clearSlots (context:vscode.ExtensionContext) {
		
		Hotkeys.slots = [];
		context.globalState.update(SLOTS, Hotkeys.slots);
		Hotkeys._onDidChangeSlot.fire([]);
		
	}
	
}

//	Functions __________________________________________________________________

