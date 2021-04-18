//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import type { TagDescriptionFormat } from '../@types/common';
import type { RefreshTagsStates, Tag, TagsStates } from '../@types/tags';

import { formatTagDescription } from '../@l13/formats';

import * as settings from '../common/settings';

import type { HotkeySlotsState } from '../states/HotkeySlotsState';

import { TagTreeItem } from './trees/items/TagTreeItem';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class TagsProvider implements vscode.TreeDataProvider<TagTreeItem> {
	
	private _onDidChangeTreeData:vscode.EventEmitter<TagTreeItem|undefined> = new vscode.EventEmitter<TagTreeItem|undefined>();
	public readonly onDidChangeTreeData:vscode.Event<TagTreeItem|undefined> = this._onDidChangeTreeData.event;
	
	public tagDescriptionFormat:TagDescriptionFormat = settings.get('tagDescriptionFormat');
	
	private tags:Tag[] = [];
	private slots:HotkeySlotsState = null;
	
	public static current:TagsProvider;
	
	public static create (states:TagsStates) {
		
		return TagsProvider.current || (TagsProvider.current = new TagsProvider(states));
		
	}
	
	private constructor ({ tags, hotkeySlots }:TagsStates) {
		
		this.tags = tags;
		this.slots = hotkeySlots;
		
	}
	
	public refresh (refreshStates?:RefreshTagsStates) {
		
		if (refreshStates?.tags) this.tags = refreshStates.tags;
		
		this._onDidChangeTreeData.fire(undefined);
		
	}
	
	public getTreeItem (element:TagTreeItem) {
		
		return element;
		
	}
	
	public getChildren () {
		
		const list:TagTreeItem[] = [];
		const tags = this.tags;
		
		if (!tags.length) return list;
		
		const slots = this.slots;
		
		tags.forEach((tag) => {
		
			const slot = slots.getByTag(tag);
			const info = formatTagDescription(tag, slot, this.tagDescriptionFormat);
			
			list.push(new TagTreeItem(tag, info));
			
		});
		
		return list;
		
	}
	
}

//	Functions __________________________________________________________________

