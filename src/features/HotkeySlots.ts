//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import * as files from '../common/files';
import * as settings from '../common/settings';

import { Item, Slot } from '../@types/hotkeys';
import { Project } from '../@types/workspaces';

//	Variables __________________________________________________________________

const SLOTS = 'slots';
const CURRENT_WORKSPACE = 'workspace';

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
		
		this.slots = context.globalState.get(SLOTS, []);
		
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
			this.context.globalState.update(SLOTS, slots);
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
		
		for (const slot of slots) {
			if (slot?.path === project.path) slots[slot.index].label = project.label;
		}
		
		this.context.globalState.update(SLOTS, slots);
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
			this.context.globalState.update(SLOTS, slots);
			this._onDidChangeSlot.fire(slots);
		}
		
	}
	
	public get (project:Project) {
		
		const slots = this.slots;
		
		for (const slot of slots) {
			if (slot?.path === project.path) return slot;
		}
		
		return null;
		
	}
	
	public clear () {
		
		this.slots = [];
		this.context.globalState.update(SLOTS, this.slots);
		this._onDidChangeSlot.fire([]);
		
	}
	
	public previousWorkspace () {
		
		const workspacesPaths = this.context.globalState.get(CURRENT_WORKSPACE, []);
		
		if (workspacesPaths[1]) files.open(workspacesPaths[1]);
		
	}
	
	public static saveCurrentWorkspace (context:vscode.ExtensionContext) {
	
		const workspacePaths = context.globalState.get(CURRENT_WORKSPACE, []);
		const workspacePath = settings.getWorkspacePath();
		
		if (workspacePath && workspacePaths[0] !== workspacePath) {
			workspacePaths.unshift(workspacePath);
			context.globalState.update(CURRENT_WORKSPACE, workspacePaths.slice(0, 2));
		}
		
	}
	
}

//	Functions __________________________________________________________________

