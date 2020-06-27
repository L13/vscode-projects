//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { Slot } from '../@types/hotkeys';
import { Project } from '../@types/projects';
import { ProjectsSettings } from './ProjectsSettings';

//	Variables __________________________________________________________________

const SLOTS = 'slots';

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class ProjectsHotkeys {
	
	public static async assignSlot (context:vscode.ExtensionContext, selectedProject:Project) {
		
		const slots:Slot[] = context.globalState.get(SLOTS, []);
		const items:{ label:string, index:number, description:string }[] = [];
		
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
				if (slot?.path === selectedProject.path) delete slots[slot.index];
			}
			slots[item.index] = {
				label: selectedProject.label,
				index: item.index,
				path: selectedProject.path,
			};
			context.globalState.update(SLOTS, slots);
		}
		
	}
	
	public static openSlot (context:vscode.ExtensionContext, index:number) {
		
		const slots:Slot[] = context.globalState.get(SLOTS, []);
		const slot = slots[index];
		
		if (slot) {
			const newWindow = ProjectsSettings.get('openInNewWindow', false);
			vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(slot.path), newWindow);
		}
	}
	
	public static updateSlot (context:vscode.ExtensionContext, project:Project) {
		
		const slots:Slot[] = context.globalState.get(SLOTS, []);
		
		for (const slot of slots) {
			if (slot?.path === project.path) slots[slot.index].label = project.label;
		}
		
		context.globalState.update(SLOTS, slots);
		
	}
	
	public static async clearSlot (context:vscode.ExtensionContext) {
		
		const slots:Slot[] = context.globalState.get(SLOTS, []);
		const items:{ label:string, index:number, description:string }[] = [];
		
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
		}
		
	}
	
	public static clearSlots (context:vscode.ExtensionContext) {
		
		context.globalState.update(SLOTS, []);
		
	}
	
}

//	Functions __________________________________________________________________

