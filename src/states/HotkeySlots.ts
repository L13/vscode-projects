//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import * as files from '../common/files';
import * as settings from '../common/settings';
import * as states from '../common/states';

import { FavoriteGroup } from '../@types/favorites';
import { Item, Slot } from '../@types/hotkeys';
import { Project, WorkspaceGroup } from '../@types/workspaces';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class HotkeySlots {
	
	private _onDidChangeSlots:vscode.EventEmitter<Slot[]> = new vscode.EventEmitter<Slot[]>();
	public readonly onDidChangeSlots:vscode.Event<Slot[]> = this._onDidChangeSlots.event;
	
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
				if (slot && slot.path === project.path) delete slots[slot.index];
			}
			slots[item.index] = {
				label: project.label,
				index: item.index,
				path: project.path,
			};
			states.updateSlots(this.context, slots);
			this._onDidChangeSlots.fire(slots);
		}
		
	}
	
	public async assignGroup (group:FavoriteGroup|WorkspaceGroup) {
		
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
				if (slot && slot.groupId === group.id) delete slots[slot.index];
			}
			slots[item.index] = {
				label: group.label,
				index: item.index,
				groupId: group.id,
				paths: group.paths,
			};
			states.updateSlots(this.context, slots);
			this._onDidChangeSlots.fire(slots);
		}
		
	}
	
	public open (index:number) {
		
		const slots = this.slots;
		const slot = slots[index];
		
		if (slot) {
			if (slot.paths) files.openAll(slot.paths);
			else files.open(slot.path);
		}
		
	}
	
	public update (project:Project) {
		
		const slots = this.slots;
		
		for (const slot of slots) {
			if (slot && slot.path === project.path) {
				slot.label = project.label;
				break;
			}
		}
		
		states.updateSlots(this.context, slots);
		this._onDidChangeSlots.fire(slots);
		
	}
	
	public remove (project:Project) {
		
		const slots = this.slots;
		
		for (let i = 0; i < slots.length; i++) {
			const slot = slots[i];
			if (slot && slot.path === project.path) {
				delete slots[i];
				break;
			}
		}
		
		states.updateSlots(this.context, slots);
		this._onDidChangeSlots.fire(slots);
		
	}
	
	public updateGroup (group:FavoriteGroup|WorkspaceGroup) {
		
		const slots = this.slots;
		
		for (const slot of slots) {
			if (slot && slot.groupId === group.id) {
				slot.label = group.label;
				slot.paths = group.paths;
				break;
			}
		}
		
		states.updateSlots(this.context, slots);
		this._onDidChangeSlots.fire(slots);
		
	}
	
	public removeGroup (group:FavoriteGroup|WorkspaceGroup) {
		
		const slots = this.slots;
		
		for (let i = 0; i < slots.length; i++) {
			const slot = slots[i];
			if (slot && slot.groupId === group.id) {
				delete slots[i];
				break;
			}
		}
		
		states.updateSlots(this.context, slots);
		this._onDidChangeSlots.fire(slots);
		
	}
	
	public async clearSlot () {
		
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
			this._onDidChangeSlots.fire(slots);
		}
		
	}
	
	public get (workspace:Project) {
		
		const slots = this.slots;
		
		for (const slot of slots) {
			if (slot && slot.path === workspace.path) return slot;
		}
		
		return null;
		
	}
	
	public getGroup (group:FavoriteGroup|WorkspaceGroup) {
		
		const slots = this.slots;
		
		for (const slot of slots) {
			if (slot && slot.groupId === group.id) return slot;
		}
		
		return null;
		
	}
	
	public clear () {
		
		states.updateSlots(this.context, this.slots = []);
		this._onDidChangeSlots.fire([]);
		
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

