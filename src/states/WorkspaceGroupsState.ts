//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { remove, sortCaseInsensitive } from '../@l13/arrays';

import { FavoriteGroup } from '../@types/favorites';
import { Project, SimpleGroupState, TypeGroupState, WorkspaceGroup } from '../@types/workspaces';

import { getNextGroupId } from '../common/groups';
import * as states from '../common/states';

import { SimpleGroupTreeItem } from '../sidebar/trees/groups/SimpleGroupTreeItem';
import { TagGroupTreeItem } from '../sidebar/trees/groups/TagGroupTreeItem';
import { TypeGroupTreeItem } from '../sidebar/trees/groups/TypeGroupTreeItem';
import { WorkspaceGroupTreeItem } from '../sidebar/trees/groups/WorkspaceGroupTreeItem';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class WorkspaceGroupsState {
	
	private static current:WorkspaceGroupsState = null;
	
	public static create (context:vscode.ExtensionContext) {
		
		return WorkspaceGroupsState.current || (WorkspaceGroupsState.current = new WorkspaceGroupsState(context));
		
	}
	
	public constructor (private readonly context:vscode.ExtensionContext) {}
	
	private _onDidUpdateWorkspaceGroup:vscode.EventEmitter<WorkspaceGroup> = new vscode.EventEmitter<WorkspaceGroup>();
	public readonly onDidUpdateWorkspaceGroup:vscode.Event<WorkspaceGroup> = this._onDidUpdateWorkspaceGroup.event;
	
	private _onDidDeleteWorkspaceGroup:vscode.EventEmitter<WorkspaceGroup> = new vscode.EventEmitter<WorkspaceGroup>();
	public readonly onDidDeleteWorkspaceGroup:vscode.Event<WorkspaceGroup> = this._onDidDeleteWorkspaceGroup.event;
	
	private _onDidChangeWorkspaceGroups:vscode.EventEmitter<WorkspaceGroup[]> = new vscode.EventEmitter<WorkspaceGroup[]>();
	public readonly onDidChangeWorkspaceGroups:vscode.Event<WorkspaceGroup[]> = this._onDidChangeWorkspaceGroups.event;
	
	public get () {
		
		return states.getWorkspaceGroups(this.context);
		
	}
	
	private save (workspaceGroups:WorkspaceGroup[]) {
		
		states.updateWorkspaceGroups(this.context, workspaceGroups);
		
	}
	
	public getSimpleGroups () {
		
		return states.getSimpleGroups(this.context);
		
	}
	
	public getTypeGroups () {
		
		return states.getTypeGroups(this.context);
		
	}
	
	public getTagGroup () {
		
		return states.getTagGroup(this.context);
		
	}
	
	public getById (groupId:number) {
		
		const workspaceGroups = this.get();
		
		return workspaceGroups.find(({ id }) => id === groupId) || null;
		
	}
	
	public getByName (groupId:string) {
		
		const workspaceGroups = this.get();
		
		return workspaceGroups.find(({ label }) => label === groupId) || null;
		
	}
	
	public add (label:string) {
		
		const workspaceGroups = this.get();
		
		for (const workspaceGroup of workspaceGroups) {
			if (workspaceGroup.label === label) return;
		}
		
		workspaceGroups.push({
			label,
			id: getNextGroupId(this.context),
			collapsed: false,
			paths: [],
		});
		
		sortWorkspaceGroups(workspaceGroups);
		
		this.save(workspaceGroups);
		this._onDidChangeWorkspaceGroups.fire(workspaceGroups);
		
	}
	
	public addWorkspace (workspace:Project, workspaceGroup:WorkspaceGroup) {
		
		const workspaceGroups = this.get();
		
		if (!workspaceGroup.paths.includes(workspace.path)) {
			const previousWorkspaceGroup = workspaceGroups.find((group) => remove(group.paths, workspace.path));
			workspaceGroup.paths.push(workspace.path);
			workspaceGroup.paths.sort();
			this.save(workspaceGroups);
			if (previousWorkspaceGroup) this._onDidUpdateWorkspaceGroup.fire(previousWorkspaceGroup);
			this._onDidUpdateWorkspaceGroup.fire(workspaceGroup);
			this._onDidChangeWorkspaceGroups.fire(workspaceGroups);
		}
		
	}
	
	public editWorkspaces (currentWorkspaceGroup:WorkspaceGroup, workspaces:Project[]) {
		
		const workspaceGroups = this.get();
		const paths = workspaces.map((workspace) => workspace.path);
		const groupId = currentWorkspaceGroup.id;
		
		for (const workspaceGroup of workspaceGroups) {
			if (workspaceGroup.id === groupId) {
				workspaceGroup.paths = paths;
				workspaceGroup.paths.sort();
				this.save(workspaceGroups);
				this._onDidUpdateWorkspaceGroup.fire(workspaceGroup);
				break;
			} else {
				let hasChanged = false;
				paths.forEach((path) => {
					
					if (remove(workspaceGroup.paths, path)) hasChanged = true;
					
				});
				if (hasChanged) this._onDidUpdateWorkspaceGroup.fire(workspaceGroup);
			}
		}
		
		this._onDidChangeWorkspaceGroups.fire(workspaceGroups);
		
	}
	
	public cleanupUnknownPaths (workspaces:Project[]) {
		
		const workspaceGroups = this.get();
		const paths = workspaces.map((workspace) => workspace.path);
		let hasChanged = false;
		
		workspaceGroups.forEach((workspaceGroup) => {
			
			for (const path of workspaceGroup.paths) {
				if (!paths.includes(path)) {
					workspaceGroup.paths = workspaceGroup.paths.filter((p) => paths.includes(p));
					hasChanged = true;
					this._onDidUpdateWorkspaceGroup.fire(workspaceGroup);
					break;
				}
			}
			
		});
		
		if (hasChanged) {
			this.save(workspaceGroups);
			this._onDidChangeWorkspaceGroups.fire(workspaceGroups);
		}
		
	}
	
	public update (favoriteGroup:FavoriteGroup) {
		
		const workspaceGroups = this.get();
		
		for (const workspaceGroup of workspaceGroups) {
			if (workspaceGroup.id === favoriteGroup.id) {
				const paths = favoriteGroup.paths;
				removePathsInWorkspaceGroups(workspaceGroups, paths);
				workspaceGroup.label = favoriteGroup.label;
				workspaceGroup.paths = paths;
				sortWorkspaceGroups(workspaceGroups);
				this.save(workspaceGroups);
				this._onDidChangeWorkspaceGroups.fire(workspaceGroups);
				break;
			}
		}
		
	}
	
	public rename (workspaceGroup:WorkspaceGroup, label:string) {
		
		const workspaceGroups = this.get();
		
		for (const group of workspaceGroups) {
			if (group.id === workspaceGroup.id) {
				group.label = label;
				sortWorkspaceGroups(workspaceGroups);
				this.save(workspaceGroups);
				this._onDidUpdateWorkspaceGroup.fire(group);
				this._onDidChangeWorkspaceGroups.fire(workspaceGroups);
				break;
			}
		}
		
	}
	
	public removeWorkspace (workspace:Project) {
		
		const workspaceGroups = this.get();
		const workspaceGroup = workspaceGroups.find((group) => remove(group.paths, workspace.path));
		
		if (workspaceGroup) {
			this.save(workspaceGroups);
			this._onDidUpdateWorkspaceGroup.fire(workspaceGroup);
			this._onDidChangeWorkspaceGroups.fire(workspaceGroups);
		}
		
	}
	
	public remove (workspaceGroup:WorkspaceGroup) {
		
		const workspaceGroups = this.get();
		const groupId = workspaceGroup.id;
		
		for (let i = 0; i < workspaceGroups.length; i++) {
			if (workspaceGroups[i].id === groupId) {
				workspaceGroups.splice(i, 1);
				this.save(workspaceGroups);
				this._onDidDeleteWorkspaceGroup.fire(workspaceGroup);
				this._onDidChangeWorkspaceGroups.fire(workspaceGroups);
				break;
			}
		}
		
	}
	
	public clear () {
		
		this.save([]);
		this._onDidChangeWorkspaceGroups.fire([]);
		
	}
	
	public saveWorkspaceGroupState (item:WorkspaceGroupTreeItem, collapsed:boolean) {
		
		const workspaceGroups = this.get();
		const groupId = item.group.id;
		
		for (const workspaceGroup of workspaceGroups) {
			if (workspaceGroup.id === groupId) {
				workspaceGroup.collapsed = collapsed;
				states.updateCollapseState(this.context, workspaceGroups);
				break;
			}
		}
		
	}
	
	public saveTagGroupState (item:TagGroupTreeItem, collapsed:boolean) {
		
		let groupState = states.getTagGroup(this.context);
		
		if (groupState) groupState.collapsed = collapsed;
		else groupState = { collapsed };
		
		states.updateTagGroup(this.context, groupState);
		
	}
	
	public saveSimpleGroupState (item:SimpleGroupTreeItem, collapsed:boolean) {
		
		const groupStates = states.getSimpleGroups(this.context);
		
		saveCollapseState(groupStates, item, collapsed);
		states.updateSimpleGroups(this.context, groupStates);
		
	}
	
	public saveTypeGroupState (item:TypeGroupTreeItem, collapsed:boolean) {
		
		const groupStates = states.getTypeGroups(this.context);
		
		saveCollapseState(groupStates, item, collapsed);
		states.updateTypeGroups(this.context, groupStates);
		
	}
	
}

//	Functions __________________________________________________________________

function saveCollapseState (groupStates:Array<SimpleGroupState|TypeGroupState>, item:SimpleGroupTreeItem|TypeGroupTreeItem, collapsed:boolean) {
	
	const type = item.group.type;
	const groupState = groupStates.find((state) => state.type === type);
	
	if (groupState) groupState.collapsed = collapsed;
	else groupStates.push({ type, collapsed });
	
	item.group.collapsed = collapsed;
	
}

function sortWorkspaceGroups (workspaceGroups:WorkspaceGroup[]) {
	
	workspaceGroups.sort(({ label: a }, { label: b }) => sortCaseInsensitive(a, b));
	
}

function removePathsInWorkspaceGroups (workspaceGroups:WorkspaceGroup[], paths:string[]) {
		
	for (const workspaceGroup of workspaceGroups) {
		for (const path of paths) remove(workspaceGroup.paths, path);
	}
	
}