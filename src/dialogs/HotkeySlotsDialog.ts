//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import * as dialogs from '../common/dialogs';

import type { FavoriteGroup } from '../@types/favorites';
import type { Item, Slot } from '../@types/hotkeys';
import type { Tag } from '../@types/tags';
import type { Project, WorkspaceGroup } from '../@types/workspaces';

import type { HotkeySlotsState } from '../states/HotkeySlotsState';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class HotkeySlotsDialog {
	
	private static current: HotkeySlotsDialog;
	
	public static create (hotkeySlotsState: HotkeySlotsState) {
		
		return HotkeySlotsDialog.current || (HotkeySlotsDialog.current = new HotkeySlotsDialog(hotkeySlotsState));
		
	}
	
	private constructor (private readonly hotkeySlotsState: HotkeySlotsState) {}
	
	public async assignWorkspace (project: Project) {
		
		const item = await this.createQuickPickDialog();
		
		if (item) this.hotkeySlotsState.assign(project, item.index);
		
	}
	
	public async assignGroup (group: FavoriteGroup|WorkspaceGroup) {
		
		const item = await this.createQuickPickDialog();
		
		if (item) this.hotkeySlotsState.assignGroup(group, item.index);
		
	}
	
	public async assignTag (tag: Tag) {
		
		const item = await this.createQuickPickDialog();
		
		if (item) this.hotkeySlotsState.assignTag(tag, item.index);
		
	}
	
	public async createQuickPickDialog () {
		
		const slots = this.hotkeySlotsState.get();
		const items: Item[] = [];
		
		for (let i = 1; i < 10; i++) {
			items.push({
				label: `Slot ${i}`,
				index: i,
				description: formatDescription(slots[i]),
			});
		}
		
		return await vscode.window.showQuickPick(items, {
			placeHolder: 'Please select a slot for the workspace.',
		});
		
	}
	
	public async remove () {
		
		const slots = this.hotkeySlotsState.get();
		const items: Item[] = [];
		
		for (const slot of slots) {
			if (slot) {
				items.push({
					label: `Slot ${slot.index}`,
					index: slot.index,
					description: formatDescription(slot),
				});
			}
		}
		
		const item = await vscode.window.showQuickPick(items, {
			placeHolder: 'Please select the slot which should be cleared.',
		});
		
		if (item) this.hotkeySlotsState.remove(item.index);
		
	}
	
	public async clear () {
		
		if (await dialogs.confirm('Delete all hotkey slots?', 'Delete')) {
			this.hotkeySlotsState.clear();
		}
		
	}
	
}

//	Functions __________________________________________________________________

function formatDescription (slot: Slot) {
	
	if (!slot) return '';
	
	if ('tagId' in slot) return `$(tag) ${slot.label}`;
	
	return slot.label;
	
}