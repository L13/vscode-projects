//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { remove, sortCaseInsensitive } from '../@l13/arrays';

import { FavoriteGroup } from '../@types/favorites';
import { GroupSimpleState, GroupTypeState, Project, WorkspaceGroup } from '../@types/workspaces';

import * as states from '../common/states';

import { GroupCustomTreeItem } from '../sidebar/trees/GroupCustomTreeItem';
import { GroupSimpleTreeItem } from '../sidebar/trees/GroupSimpleTreeItem';
import { GroupTypeTreeItem } from '../sidebar/trees/GroupTypeTreeItem';

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
		
		return states.getGroupSimpleStates(this.context);
		
	}
	
	public getTypeGroups () {
		
		return states.getGroupTypeStates(this.context);
		
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
			if (workspaceGroup.label === label) {
				vscode.window.showErrorMessage(`Workspace group "${label}" exists!`);
				return;
			}
		}
		
		workspaceGroups.push({
			label,
			id: states.getNextGroupId(this.context),
			collapsed: false,
			paths: [],
			type: 'custom'
		});
		
		workspaceGroups.sort(({ label:a }, { label:b }) => sortCaseInsensitive(a, b));
		
		this.save(workspaceGroups);
		this._onDidChangeWorkspaceGroups.fire(workspaceGroups);
		
	}
	
	public addWorkspace (workspace:Project, workspaceGroup:WorkspaceGroup) {
		
		const workspaceGroups = this.get();
		
		if (workspaceGroup && !workspaceGroup.paths.includes(workspace.path)) {
			workspaceGroups.some((group) => remove(group.paths, workspace.path));
			workspaceGroup.paths.push(workspace.path);
			workspaceGroup.paths.sort();
			this.save(workspaceGroups);
			this._onDidChangeWorkspaceGroups.fire(workspaceGroups);
			this._onDidUpdateWorkspaceGroup.fire(workspaceGroup);
		}
		
	}
	
	public update (favoriteGroup:FavoriteGroup) {
		
		const workspaceGroups = this.get();
		
		for (const workspaceGroup of workspaceGroups) {
			if (workspaceGroup.id === favoriteGroup.id) {
				workspaceGroup.label = favoriteGroup.label;
				workspaceGroup.paths = favoriteGroup.paths;
				workspaceGroups.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
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
				workspaceGroups.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
				this.save(workspaceGroups);
				this._onDidChangeWorkspaceGroups.fire(workspaceGroups);
				this._onDidUpdateWorkspaceGroup.fire(group);
				break;
			}
		}
		
	}
	
	public removeWorkspace (workspace:Project) {
		
		const workspaceGroups = this.get();
		const workspaceGroup = workspaceGroups.find((group) => remove(group.paths, workspace.path));
		
		if (workspaceGroup) {
			this.save(workspaceGroups);
			this._onDidChangeWorkspaceGroups.fire(workspaceGroups);
			this._onDidUpdateWorkspaceGroup.fire(workspaceGroup);
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
	
	public saveWorkspaceGroupState (item:GroupCustomTreeItem, collapsed:boolean) {
		
		const workspaceGroups = this.get();
		const groupId = item.group.id;
		
		for (const workspaceGroup of workspaceGroups) {
			if (workspaceGroup.id === groupId) {
				workspaceGroup.collapsed = collapsed;
				this.save(workspaceGroups);
				break;
			}
		}
		
	}
	
	public saveSimpleGroupState (item:GroupSimpleTreeItem, collapsed:boolean) {
		
		const groupStates = states.getGroupSimpleStates(this.context);
		
		saveCollapseState(groupStates, item, collapsed);
		states.updateGroupSimpleStates(this.context, groupStates);
		
	}
	
	public saveTypeGroupState (item:GroupTypeTreeItem, collapsed:boolean) {
		
		const groupStates = states.getGroupSimpleStates(this.context);
		
		saveCollapseState(groupStates, item, collapsed);
		states.updateGroupSimpleStates(this.context, groupStates);
		
	}
	
}

//	Functions __________________________________________________________________

function saveCollapseState (groupStates:(GroupSimpleState|GroupTypeState)[], item:GroupSimpleTreeItem|GroupTypeTreeItem, collapsed:boolean) {
	
	const type = item.group.type;
	const groupState = groupStates.find((state) => state.type === type);
	
	if (groupState) groupState.collapsed = collapsed;
	else groupStates.push({ type, collapsed });
	
	item.group.collapsed = collapsed;
	
}