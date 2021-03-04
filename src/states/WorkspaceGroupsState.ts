//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { remove, sortCaseInsensitive } from '../@l13/arrays';

import { FavoriteGroup } from '../@types/favorites';
import { GroupSimpleState, GroupTypeState, Project, WorkspaceGroup } from '../@types/workspaces';

import * as dialogs from '../common/dialogs';
import * as states from '../common/states';

import { GroupCustomTreeItem } from '../sidebar/trees/GroupCustomTreeItem';
import { GroupSimpleTreeItem } from '../sidebar/trees/GroupSimpleTreeItem';
import { GroupTypeTreeItem } from '../sidebar/trees/GroupTypeTreeItem';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class WorkspaceGroupsState {
	
	private static currentWorkspaceGroupsState:WorkspaceGroupsState = null;
	
	public static createWorkspaceGroupsState (context:vscode.ExtensionContext) {
		
		return WorkspaceGroupsState.currentWorkspaceGroupsState || (WorkspaceGroupsState.currentWorkspaceGroupsState = new WorkspaceGroupsState(context));
		
	}
	
	public constructor (private readonly context:vscode.ExtensionContext) {}
	
	private _onDidUpdateWorkspaceGroup:vscode.EventEmitter<WorkspaceGroup> = new vscode.EventEmitter<WorkspaceGroup>();
	public readonly onDidUpdateWorkspaceGroup:vscode.Event<WorkspaceGroup> = this._onDidUpdateWorkspaceGroup.event;
	
	private _onDidDeleteWorkspaceGroup:vscode.EventEmitter<WorkspaceGroup> = new vscode.EventEmitter<WorkspaceGroup>();
	public readonly onDidDeleteWorkspaceGroup:vscode.Event<WorkspaceGroup> = this._onDidDeleteWorkspaceGroup.event;
	
	private _onDidChangeWorkspaceGroups:vscode.EventEmitter<WorkspaceGroup[]> = new vscode.EventEmitter<WorkspaceGroup[]>();
	public readonly onDidChangeWorkspaceGroups:vscode.Event<WorkspaceGroup[]> = this._onDidChangeWorkspaceGroups.event;
	
	public getWorkspaceGroups () {
		
		return states.getWorkspaceGroups(this.context);
		
	}
	
	public getSimpleGroups () {
		
		return states.getGroupSimpleStates(this.context);
		
	}
	
	public getTypeGroups () {
		
		return states.getGroupTypeStates(this.context);
		
	}
	
	public getWorkspaceGroupById (groupId:number) {
		
		const workspaceGroups = states.getWorkspaceGroups(this.context);
		
		for (const workspaceGroup of workspaceGroups) {
			if (workspaceGroup.id === groupId) return workspaceGroup;
		}
		
		return null;
		
	}
	
	public async addWorkspaceGroup () {
		
		const label = await vscode.window.showInputBox({
			placeHolder: 'Please enter a name for the group.',
		});
		
		if (!label) return;
		
		const workspaceGroups = states.getWorkspaceGroups(this.context);
		
		for (const workspaceGroup of workspaceGroups) {
			if (workspaceGroup.label === label) {
				return vscode.window.showErrorMessage(`Workspace group "${label}" exists!`);
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
		
		states.updateWorkspaceGroups(this.context, workspaceGroups);
		this._onDidChangeWorkspaceGroups.fire(workspaceGroups);
		
	}
	
	public async addWorkspaceToGroup (workspace:Project) {
		
		const workspaceGroups = states.getWorkspaceGroups(this.context);
		
		if (!workspaceGroups.length) await this.addWorkspaceGroup();
		
		const workspaceGroup = workspaceGroups.length > 1 ? await vscode.window.showQuickPick(workspaceGroups) : workspaceGroups[0];
		
		if (workspaceGroup && !workspaceGroup.paths.includes(workspace.path)) {
			workspaceGroups.some((group) => remove(group.paths, workspace.path));
			workspaceGroup.paths.push(workspace.path);
			workspaceGroup.paths.sort();
			states.updateWorkspaceGroups(this.context, workspaceGroups);
			this._onDidChangeWorkspaceGroups.fire(workspaceGroups);
			this._onDidUpdateWorkspaceGroup.fire(workspaceGroup);
		}
		
	}
	
	public async updateWorkspaceGroup (favoriteGroup:FavoriteGroup) {
		
		const workspaceGroups = states.getWorkspaceGroups(this.context);
		
		for (const workspaceGroup of workspaceGroups) {
			if (workspaceGroup.id === favoriteGroup.id) {
				workspaceGroup.label = favoriteGroup.label;
				workspaceGroup.paths = favoriteGroup.paths;
				workspaceGroups.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
				states.updateWorkspaceGroups(this.context, workspaceGroups);
				this._onDidChangeWorkspaceGroups.fire(workspaceGroups);
				break;
			}
		}
		
	}
	
	public removeFromWorkspaceGroup (workspace:Project) {
		
		const workspaceGroups = states.getWorkspaceGroups(this.context);
		const workspaceGroup = workspaceGroups.find((group) => remove(group.paths, workspace.path));
		
		if (workspaceGroup) {
			states.updateWorkspaceGroups(this.context, workspaceGroups);
			this._onDidChangeWorkspaceGroups.fire(workspaceGroups);
			this._onDidUpdateWorkspaceGroup.fire(workspaceGroup);
		}
		
	}
	
	public async renameWorkspaceGroup (workspaceGroup:WorkspaceGroup) {
		
		const value = await vscode.window.showInputBox({
			placeHolder: 'Please enter a new name for the group.',
			value: workspaceGroup.label,
		});
		
		if (!value || workspaceGroup.label === value) return;
		
		const workspaceGroups = states.getWorkspaceGroups(this.context);
		
		for (const group of workspaceGroups) {
			if (group.id === workspaceGroup.id) {
				group.label = value;
				workspaceGroups.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
				states.updateWorkspaceGroups(this.context, workspaceGroups);
				this._onDidChangeWorkspaceGroups.fire(workspaceGroups);
				this._onDidUpdateWorkspaceGroup.fire(group);
				break;
			}
		}
		
	}
	
	public async removeWorkspaceGroup (workspaceGroup:WorkspaceGroup) {
		
		const value = await dialogs.confirm(`Delete workspace group "${workspaceGroup.label}"?`, 'Delete');
		
		if (value) {
			const workspaceGroups = states.getWorkspaceGroups(this.context);
			const groupId = workspaceGroup.id;
			
			for (let i = 0; i < workspaceGroups.length; i++) {
				if (workspaceGroups[i].id === groupId) {
					workspaceGroups.splice(i, 1);
					states.updateWorkspaceGroups(this.context, workspaceGroups);
					this._onDidDeleteWorkspaceGroup.fire(workspaceGroup);
					this._onDidChangeWorkspaceGroups.fire(workspaceGroups);
					break;
				}
			}
		}
		
	}
	
	public async clearWorkspaceGroups () {
		
		if (await dialogs.confirm(`Delete all workspace groups?'`, 'Delete')) {
			states.updateWorkspaceGroups(this.context, []);
			this._onDidChangeWorkspaceGroups.fire([]);
		}
		
	}
	
	public saveWorkspaceGroupState (item:GroupCustomTreeItem, collapsed:boolean) {
		
		const workspaceGroups = states.getWorkspaceGroups(this.context);
		const groupId = item.group.id;
		
		for (const workspaceGroup of workspaceGroups) {
			if (workspaceGroup.id === groupId) {
				workspaceGroup.collapsed = collapsed;
				states.updateWorkspaceGroups(this.context, workspaceGroups);
				break;
			}
		}
		
	}
	
	public saveGroupSimpleState (item:GroupSimpleTreeItem, collapsed:boolean) {
		
		const groupStates = states.getGroupSimpleStates(this.context);
		
		addCollapseState(groupStates, item, collapsed);
		states.updateGroupSimpleStates(this.context, groupStates);
		
	}
	
	public saveGroupTypeState (item:GroupTypeTreeItem, collapsed:boolean) {
		
		const groupStates = states.getGroupSimpleStates(this.context);
		
		addCollapseState(groupStates, item, collapsed);
		states.updateGroupSimpleStates(this.context, groupStates);
		
	}
	
}

//	Functions __________________________________________________________________

function addCollapseState (groupStates:(GroupSimpleState|GroupTypeState)[], item:GroupSimpleTreeItem|GroupTypeTreeItem, collapsed:boolean) {
	
	const type = item.group.type;
	const groupState = groupStates.find((state) => state.type === type);
	
	if (groupState) groupState.collapsed = collapsed;
	else groupStates.push({ type, collapsed });
	
	item.group.collapsed = collapsed;
	
}