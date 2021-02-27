//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import * as files from '../common/files';
import * as settings from '../common/settings';
import * as states from '../common/states';

import { Item, Slot } from '../@types/hotkeys';
import { Project } from '../@types/workspaces';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class HotkeySlots {
	
	private _onDidChangeSlot:vscode.EventEmitter<Slot[]> = new vscode.EventEmitter<Slot[]>();
	public readonly onDidChangeSlot:vscode.Event<Slot[]> = this._onDidChangeSlot.event;
	
	public static current:HotkeySlots;
	
	public slots:Slot[] = null;
	
	public static create (context:vscode.ExtensionContext) {
		
		return HotkeySlots.current || (HotkeySlots.current = new HotkeySlots(context));
		
	}
	
	private constructor (private readonly context:vscode.ExtensionContext) {
		
		this.slots = states.getSlots(context);
		
	}
	
	public refresh () {
		
		this.slots = states.getSlots(this.context);
		
	}
	
	public async assign (project:Project) {
		
		const slots = this.slots;
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
			states.updateSlots(this.context, slots);
			this._onDidChangeSlot.fire(slots);
		}
		
	}
	
	public open (index:number) {
		
		const slots = this.slots;
		const slot = slots[index];
		
		if (slot) files.open(slot.path);
		
	}
	
	public update (project:Project) {
		
		const slots = this.slots;
		
		for (let i = 0; i < slots.length; i++) {
			const slot = slots[i];
			if (slot?.path === project.path) {
				if (!project.removed) slots[slot.index].label = project.label;
				else delete slots[i];
				break;
			}
		}
		
		states.updateSlots(this.context, slots);
		this._onDidChangeSlot.fire(slots);
		
	}
	
	public async remove () {
		
		const slots = this.slots;
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
			states.updateSlots(this.context, slots);
			this._onDidChangeSlot.fire(slots);
		}
		
	}
	
	public get (workspace:Project) {
		
		const slots = this.slots;
		
		for (const slot of slots) {
			if (slot?.path === workspace.path) return slot;
		}
		
		return null;
		
	}
	
	public clear () {
		
		states.updateSlots(this.context, this.slots = []);
		this._onDidChangeSlot.fire([]);
		
	}
	
	public previousWorkspace () {
		
		const workspacesPaths = states.getCurrentWorkspace(this.context);
		const workspacePath = settings.getCurrentWorkspacePath();
		
		if (workspacesPaths[1] && workspacesPaths[1] !== workspacePath) files.open(workspacesPaths[1]);
	//	Fixes async saveCurrentWorkspace if keyboard shortcut was pressed multiple times really fast
		else if (workspacesPaths[0] && workspacesPaths[0] !== workspacePath) files.open(workspacesPaths[0]);
		
	}
	
	public static saveCurrentWorkspace (context:vscode.ExtensionContext) {
	
		const workspacePaths = states.getCurrentWorkspace(context);
		const workspacePath = settings.getCurrentWorkspacePath();
		
		if (workspacePath && workspacePaths[0] !== workspacePath) {
			workspacePaths.unshift(workspacePath);
			states.updateCurrentWorkspace(context, workspacePaths);
		}
		
	}
	
}

//	Functions __________________________________________________________________

