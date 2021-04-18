//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { remove, sortCaseInsensitive } from '../@l13/arrays';

import { Tag } from '../@types/tags';
import { Project } from '../@types/workspaces';

import { getNextTagId } from '../common/groups';
import * as states from '../common/states';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class TagsState {
	
	private static current:TagsState = null;
	
	public static create (context:vscode.ExtensionContext) {
		
		return TagsState.current || (TagsState.current = new TagsState(context));
		
	}
	
	public constructor (private readonly context:vscode.ExtensionContext) {}
	
	private _onDidUpdateTag:vscode.EventEmitter<Tag> = new vscode.EventEmitter<Tag>();
	public readonly onDidUpdateTag:vscode.Event<Tag> = this._onDidUpdateTag.event;
	
	private _onDidDeleteTag:vscode.EventEmitter<Tag> = new vscode.EventEmitter<Tag>();
	public readonly onDidDeleteTag:vscode.Event<Tag> = this._onDidDeleteTag.event;
	
	private _onDidChangeTags:vscode.EventEmitter<Tag[]> = new vscode.EventEmitter<Tag[]>();
	public readonly onDidChangeTags:vscode.Event<Tag[]> = this._onDidChangeTags.event;
	
	public get () {
		
		return states.getTags(this.context);
		
	}
	
	private save (tags:Tag[]) {
		
		states.updateTags(this.context, tags);
		
	}
	
	public getById (tagId:number) {
		
		const tags = this.get();
		
		return tags.find(({ id }) => id === tagId) || null;
		
	}
	
	public getByName (name:string) {
		
		const tags = this.get();
		
		return tags.find(({ label }) => label === name) || null;
		
	}
	
	public add (label:string) {
		
		const tags = this.get();
		
		for (const tag of tags) {
			if (tag.label === label) return;
		}
		
		tags.push({
			label,
			id: getNextTagId(this.context),
			paths: [],
		});
		
		sortTags(tags);
		
		this.save(tags);
		this._onDidChangeTags.fire(tags);
		
	}
	
	public editTags (workspace:Project, selectTags:Tag[]) {
		
		const tags = this.get();
		const path = workspace.path;
		
		for (const tag of tags) {
			if (selectTags.some(({ id }) => id === tag.id)) {
				if (!tag.paths.includes(path)) {
					tag.paths.push(path);
					tag.paths.sort();
				}
			} else remove(tag.paths, path);
		}
		
		this.save(tags);
		this._onDidChangeTags.fire(tags);
		
	}
	
	public editWorkspaces (currentTag:Tag, workspaces:Project[]) {
		
		const tags = this.get();
		const paths = workspaces.map((workspace) => workspace.path);
		const tagId = currentTag.id;
		
		for (const tag of tags) {
			if (tag.id === tagId) {
				tag.paths = paths;
				tag.paths.sort();
				this.save(tags);
				this._onDidUpdateTag.fire(tag);
				this._onDidChangeTags.fire(tags);
				break;
			}
		}
		
	}
	
	public cleanupUnknownPaths (workspaces:Project[]) {
		
		const tags = this.get();
		const paths = workspaces.map((workspace) => workspace.path);
		let hasChanged = false;
		
		tags.forEach((tag) => {
			
			for (const path of tag.paths) {
				if (!paths.includes(path)) {
					tag.paths = tag.paths.filter((p) => paths.includes(p));
					hasChanged = true;
					this._onDidUpdateTag.fire(tag);
					break;
				}
			}
			
		});
		
		if (hasChanged) {
			this.save(tags);
			this._onDidChangeTags.fire(tags);
		}
		
	}
	
	public rename (currentTag:Tag, label:string) {
		
		const tags = this.get();
		
		for (const tag of tags) {
			if (tag.id === currentTag.id) {
				tag.label = label;
				sortTags(tags);
				this.save(tags);
				this._onDidUpdateTag.fire(tag);
				this._onDidChangeTags.fire(tags);
				break;
			}
		}
		
	}
	
	public removeWorkspace (currentTag:Tag, workspace:Project) {
		
		if (remove(currentTag.paths, workspace.path)) {
			const tags = this.get();
			for (const tag of tags) {
				if (tag.id === currentTag.id) {
					tag.paths = currentTag.paths;
					this.save(tags);
					this._onDidUpdateTag.fire(currentTag);
					this._onDidChangeTags.fire(tags);
					break;
				}
			}
		}
		
	}
	
	public remove (currentTag:Tag) {
		
		const tags = this.get();
		const tagId = currentTag.id;
		
		for (let i = 0; i < tags.length; i++) {
			if (tags[i].id === tagId) {
				tags.splice(i, 1);
				this.save(tags);
				this._onDidDeleteTag.fire(currentTag);
				this._onDidChangeTags.fire(tags);
				break;
			}
		}
		
	}
	
	public clear () {
		
		this.save([]);
		this._onDidChangeTags.fire([]);
		
	}
	
}

//	Functions __________________________________________________________________

function sortTags (tags:Tag[]) {
	
	tags.sort(({ label: a }, { label: b }) => sortCaseInsensitive(a, b));
	
}