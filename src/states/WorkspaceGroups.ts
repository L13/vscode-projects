//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { remove, sortCaseInsensitive } from '../@l13/arrays';

import { FavoriteGroup } from '../@types/favorites';
import { GroupSimpleState, GroupTypeState } from '../@types/groups';
import { Project, WorkspaceGroup } from '../@types/workspaces';

import * as dialogs from '../common/dialogs';
import * as states from '../common/states';

import { GroupCustomTreeItem } from '../sidebar/trees/GroupCustomTreeItem';
import { GroupSimpleTreeItem } from '../sidebar/trees/GroupSimpleTreeItem';
import { GroupTypeTreeItem } from '../sidebar/trees/GroupTypeTreeItem';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class WorkspaceGroups {
	
	private static _onDidUpdateWorkspaceGroup:vscode.EventEmitter<WorkspaceGroup> = new vscode.EventEmitter<WorkspaceGroup>();
	public static readonly onDidUpdateWorkspaceGroup:vscode.Event<WorkspaceGroup> = WorkspaceGroups._onDidUpdateWorkspaceGroup.event;
	
	private static _onDidChangeWorkspaceGroups:vscode.EventEmitter<undefined> = new vscode.EventEmitter<undefined>();
	public static readonly onDidChangeWorkspaceGroups:vscode.Event<undefined> = WorkspaceGroups._onDidChangeWorkspaceGroups.event;
	
	public static async addWorkspaceGroup (context:vscode.ExtensionContext) {
		
		const label = await vscode.window.showInputBox({
			placeHolder: 'Please enter a name for the group.',
		});
		
		if (!label) return;
		
		const workspaceGroups = states.getWorkspaceGroups(context);
		
		for (const workspaceGroup of workspaceGroups) {
			if (workspaceGroup.label === label) {
				return vscode.window.showErrorMessage(`Workspace group "${label}" exists!`);
			}
		}
		
		workspaceGroups.push({
			label,
			id: states.getNextGroupId(context),
			collapsed: false,
			paths: [],
			type: 'custom'
		});
		
		workspaceGroups.sort(({ label:a }, { label:b }) => sortCaseInsensitive(a, b));
		
		states.updateWorkspaceGroups(context, workspaceGroups);
		WorkspaceGroups._onDidChangeWorkspaceGroups.fire();
		
	}
	
	public static async addWorkspaceToGroup (context:vscode.ExtensionContext, workspace:Project) {
		
		const workspaceGroups = states.getWorkspaceGroups(context);
		
		if (!workspaceGroups.length) await WorkspaceGroups.addWorkspaceGroup(context);
		
		const workspaceGroup = workspaceGroups.length > 1 ? await vscode.window.showQuickPick(workspaceGroups) : workspaceGroups[0];
		
		if (workspaceGroup && !workspaceGroup.paths.includes(workspace.path)) {
			workspaceGroups.some((group) => remove(group.paths, workspace.path));
			workspaceGroup.paths.push(workspace.path);
			workspaceGroup.paths.sort();
			states.updateWorkspaceGroups(context, workspaceGroups);
			WorkspaceGroups._onDidChangeWorkspaceGroups.fire();
			WorkspaceGroups._onDidUpdateWorkspaceGroup.fire(workspaceGroup);
		}
		
	}
	
	public static async updateWorkspaceGroup (context:vscode.ExtensionContext, favoriteGroup:FavoriteGroup) {
		
		const workspaceGroups = states.getWorkspaceGroups(context);
		
		for (const workspaceGroup of workspaceGroups) {
			if (workspaceGroup.id === favoriteGroup.id) {
				workspaceGroup.label = favoriteGroup.label;
				workspaceGroup.paths = favoriteGroup.paths;
				workspaceGroups.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
				states.updateWorkspaceGroups(context, workspaceGroups);
				WorkspaceGroups._onDidChangeWorkspaceGroups.fire();
				break;
			}
		}
		
	}
	
	public static removeFromWorkspaceGroup (context:vscode.ExtensionContext, workspace:Project) {
		
		const workspaceGroups = states.getWorkspaceGroups(context);
		const workspaceGroup = workspaceGroups.find((group) => remove(group.paths, workspace.path));
		
		if (workspaceGroup) {
			states.updateWorkspaceGroups(context, workspaceGroups);
			WorkspaceGroups._onDidChangeWorkspaceGroups.fire();
			WorkspaceGroups._onDidUpdateWorkspaceGroup.fire(workspaceGroup);
		}
		
	}
	
	public static async renameWorkspaceGroup (context:vscode.ExtensionContext, workspaceGroup:WorkspaceGroup) {
		
		const value = await vscode.window.showInputBox({
			placeHolder: 'Please enter a new name for the group.',
			value: workspaceGroup.label,
		});
		
		if (!value || workspaceGroup.label === value) return;
		
		const workspaceGroups = states.getWorkspaceGroups(context);
		
		for (const group of workspaceGroups) {
			if (group.id === workspaceGroup.id) {
				group.label = value;
				workspaceGroups.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
				states.updateWorkspaceGroups(context, workspaceGroups);
				WorkspaceGroups._onDidChangeWorkspaceGroups.fire();
				WorkspaceGroups._onDidUpdateWorkspaceGroup.fire(group);
				break;
			}
		}
		
	}
	
	public static async removeWorkspaceGroup (context:vscode.ExtensionContext, workspaceGroup:WorkspaceGroup) {
		
		const value = await dialogs.confirm(`Delete workspace group "${workspaceGroup.label}"?`, 'Delete');
		
		if (value) {
			const workspaceGroups = states.getWorkspaceGroups(context);
			const groupId = workspaceGroup.id;
			
			for (let i = 0; i < workspaceGroups.length; i++) {
				if (workspaceGroups[i].id === groupId) {
					workspaceGroups.splice(i, 1);
					states.updateWorkspaceGroups(context, workspaceGroups);
					WorkspaceGroups._onDidChangeWorkspaceGroups.fire();
					break;
				}
			}
		}
		
	}
	
	public static async clearWorkspaceGroups (context:vscode.ExtensionContext) {
		
		if (await dialogs.confirm(`Delete all workspace groups?'`, 'Delete')) {
			states.updateWorkspaceGroups(context, []);
			WorkspaceGroups._onDidChangeWorkspaceGroups.fire();
		}
		
	}
	
	public static saveWorkspaceGroupState (context:vscode.ExtensionContext, item:GroupCustomTreeItem, collapsed:boolean) {
		
		const workspaceGroups = states.getWorkspaceGroups(context);
		const groupId = item.group.id;
		
		for (const workspaceGroup of workspaceGroups) {
			if (workspaceGroup.id === groupId) {
				workspaceGroup.collapsed = collapsed;
				states.updateWorkspaceGroups(context, workspaceGroups);
				break;
			}
		}
		
	}
	
	public static saveGroupSimpleState (context:vscode.ExtensionContext, item:GroupSimpleTreeItem, collapsed:boolean) {
		
		const groupStates = states.getGroupSimpleStates(context);
		
		addCollapseState(groupStates, item, collapsed);
		states.updateGroupSimpleStates(context, groupStates);
		
	}
	
	public static saveGroupTypeState (context:vscode.ExtensionContext, item:GroupTypeTreeItem, collapsed:boolean) {
		
		const groupStates = states.getGroupSimpleStates(context);
		
		addCollapseState(groupStates, item, collapsed);
		states.updateGroupSimpleStates(context, groupStates);
		
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