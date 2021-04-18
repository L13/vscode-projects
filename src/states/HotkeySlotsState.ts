//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { FavoriteGroup } from '../@types/favorites';
import { Slot } from '../@types/hotkeys';
import { Tag } from '../@types/tags';
import { Project, WorkspaceGroup } from '../@types/workspaces';

import * as states from '../common/states';
import { getCurrentWorkspacePath } from '../common/workspaces';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class HotkeySlotsState {
	
	private static current:HotkeySlotsState;
	
	public static create (context:vscode.ExtensionContext) {
		
		return HotkeySlotsState.current || (HotkeySlotsState.current = new HotkeySlotsState(context));
		
	}
	
	private _onDidChangeSlots:vscode.EventEmitter<Slot[]> = new vscode.EventEmitter<Slot[]>();
	public readonly onDidChangeSlots:vscode.Event<Slot[]> = this._onDidChangeSlots.event;
	
	private slots:Slot[] = null;
	
	private constructor (private readonly context:vscode.ExtensionContext) {
		
		this.slots = states.getSlots(context);
		
	}
	
	public refresh () {
		
		this.slots = states.getSlots(this.context);
		
	}
	
	public get () {
		
		return this.slots;
		
	}
	
	public getByWorkspace (workspace:Project) {
		
		const slots = this.slots;
		
		for (const slot of slots) {
			if (slot && slot.path === workspace.path) return slot;
		}
		
		return null;
		
	}
	
	public getByGroup (group:FavoriteGroup|WorkspaceGroup) {
		
		const slots = this.slots;
		
		for (const slot of slots) {
			if (slot && slot.groupId === group.id) return slot;
		}
		
		return null;
		
	}
	
	public getByTag (tag:Tag) {
		
		const slots = this.slots;
		
		for (const slot of slots) {
			if (slot && slot.tagId === tag.id) return slot;
		}
		
		return null;
		
	}
	
	public assign (project:Project, index:number) {
		
		const slots = this.slots;
		
		for (const slot of slots) {
			if (slot && slot.path === project.path) delete slots[slot.index];
		}
		
		slots[index] = {
			label: project.label,
			index,
			path: project.path,
		};
		
		states.updateSlots(this.context, slots);
		this._onDidChangeSlots.fire(slots);
		
	}
	
	public assignGroup (group:FavoriteGroup|WorkspaceGroup, index:number) {
		
		const slots = this.slots;
		
		for (const slot of slots) {
			if (slot && slot.groupId === group.id) delete slots[slot.index];
		}
		
		slots[index] = {
			label: group.label,
			index,
			groupId: group.id,
			paths: group.paths,
		};
		
		states.updateSlots(this.context, slots);
		this._onDidChangeSlots.fire(slots);
		
	}
	
	public assignTag (tag:Tag, index:number) {
		
		const slots = this.slots;
		
		for (const slot of slots) {
			if (slot && slot.tagId === tag.id) delete slots[slot.index];
		}
		
		slots[index] = {
			label: tag.label,
			index,
			tagId: tag.id,
			paths: tag.paths,
		};
		
		states.updateSlots(this.context, slots);
		this._onDidChangeSlots.fire(slots);
		
	}
	
	public updateWorkspace (project:Project) {
		
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
	
	public updateTag (tag:Tag) {
		
		const slots = this.slots;
		
		for (const slot of slots) {
			if (slot && slot.tagId === tag.id) {
				slot.label = tag.label;
				slot.paths = tag.paths;
				break;
			}
		}
		
		states.updateSlots(this.context, slots);
		this._onDidChangeSlots.fire(slots);
		
	}
	
	public removeWorkspace (project:Project) {
		
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
	
	public removeTag (tag:Tag) {
		
		const slots = this.slots;
		
		for (let i = 0; i < slots.length; i++) {
			const slot = slots[i];
			if (slot && slot.tagId === tag.id) {
				delete slots[i];
				break;
			}
		}
		
		states.updateSlots(this.context, slots);
		this._onDidChangeSlots.fire(slots);
		
	}
	
	public remove (index:number) {
		
		const slots = this.slots;
		
		delete slots[index];
		states.updateSlots(this.context, slots);
		this._onDidChangeSlots.fire(slots);
		
	}
	
	public clear () {
		
		states.updateSlots(this.context, this.slots = []);
		this._onDidChangeSlots.fire([]);
		
	}
	
	public getPreviousWorkspace () {
		
		const workspacesPaths = states.getCurrentWorkspace(this.context);
		const workspacePath = getCurrentWorkspacePath();
		
		if (workspacesPaths[1] && workspacesPaths[1] !== workspacePath) return workspacesPaths[1];
	//	Fixes async saveCurrentWorkspace if keyboard shortcut was pressed multiple times really fast
		else if (workspacesPaths[0] && workspacesPaths[0] !== workspacePath) return workspacesPaths[0];
		
	}
	
	public saveCurrentWorkspace () {
	
		const workspacePaths = states.getCurrentWorkspace(this.context);
		const workspacePath = getCurrentWorkspacePath();
		
		if (workspacePath && workspacePaths[0] !== workspacePath) {
			workspacePaths.unshift(workspacePath);
			states.updateCurrentWorkspace(this.context, workspacePaths.slice(0, 2));
		}
		
	}
	
}

//	Functions __________________________________________________________________

