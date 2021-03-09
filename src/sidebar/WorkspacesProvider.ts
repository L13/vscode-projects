//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { formatLabel } from '../@l13/formats';

import { InitialState, WorkspaceSorting } from '../@types/common';
import {
	Project,
	RefreshWorkspacesStates,
	SimpleGroup,
	SimpleGroupState,
	TypeGroup,
	TypeGroupState,
	WorkspaceGroup,
	WorkspacesStates,
	WorkspacesTreeItems,
} from '../@types/workspaces';

import * as settings from '../common/settings';
import * as workspaces from '../common/workspaces';

import { HotkeySlotsState } from '../states/HotkeySlotsState';

import { ColorPickerTreeItem } from './trees/ColorPickerTreeItem';
import { CurrentWorkspaceTreeItem } from './trees/CurrentWorkspaceTreeItem';
import { ProjectTreeItem } from './trees/ProjectTreeItem';
import { SimpleGroupTreeItem } from './trees/SimpleGroupTreeItem';
import { TypeGroupTreeItem } from './trees/TypeGroupTreeItem';
import { UnknownProjectTreeItem } from './trees/UnknownProjectTreeItem';
import { WorkspaceGroupTreeItem } from './trees/WorkspaceGroupTreeItem';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class WorkspacesProvider implements vscode.TreeDataProvider<WorkspacesTreeItems> {
	
	public static current:WorkspacesProvider;
	
	public static create (states:WorkspacesStates) {
		
		return WorkspacesProvider.current || (WorkspacesProvider.current = new WorkspacesProvider(states));
		
	}
	
	private _onDidChangeTreeData:vscode.EventEmitter<WorkspacesTreeItems|undefined> = new vscode.EventEmitter<WorkspacesTreeItems|undefined>();
	public readonly onDidChangeTreeData:vscode.Event<WorkspacesTreeItems|undefined> = this._onDidChangeTreeData.event;
	
	private _onWillInitView:vscode.EventEmitter<WorkspacesTreeItems|undefined> = new vscode.EventEmitter<WorkspacesTreeItems|undefined>();
	public readonly onWillInitView:vscode.Event<WorkspacesTreeItems|undefined> = this._onWillInitView.event;
	
	private disposables:vscode.Disposable[] = [];
	
	public sortWorkspacesBy:WorkspaceSorting = settings.get('sortWorkspacesBy');
	
	private workspaces:Project[] = null;
	private workspaceGroups:WorkspaceGroup[] = [];
	
	private slots:HotkeySlotsState = null;
	
	private refreshTask:() => Promise<Project[]> = null;
	
	public readonly colorPickerTreeItem = new ColorPickerTreeItem();
	
	public colorPickerProject:Project = null;
	
	private simpleGroups:SimpleGroup[] = [
		{ label: 'Projects', type: 'project', projectTypes: ['folder', 'folders'], collapsed: false },
		{ label: 'Git', type: 'git', projectTypes: ['git'], collapsed: false },
		{ label: 'Visual Studio Code', type: 'vscode', projectTypes: ['vscode', 'workspace'], collapsed: false },
		{ label: 'Subfolders', type: 'subfolder', projectTypes: ['subfolder'], collapsed: false },
	];
	
	private typeGroups:TypeGroup[] = [
		{ label: 'Projects', type: 'folder', collapsed: false },
		{ label: 'Project Workspaces', type: 'folders', collapsed: false },
		{ label: 'Git', type: 'git', collapsed: false },
		{ label: 'Visual Studio Code', type: 'vscode', collapsed: false },
		{ label: 'Workspaces', type: 'workspace', collapsed: false },
		{ label: 'Subfolders', type: 'subfolder', collapsed: false },
	];
	
	private constructor ({ hotkeySlots, workspaces, workspaceGroups, simpleGroups, typeGroups }:WorkspacesStates) {
		
		this.workspaces = workspaces;
		this.workspaceGroups = workspaceGroups;
		
		this.slots = hotkeySlots;
		
		const simpleGroupStates = simpleGroups;
		const typeGroupStates = typeGroups;
		const initialState:InitialState = settings.get('initialWorkspacesGroupState', 'Remember');
		
		if (initialState === 'Remember') {
			setCollapseGroupState(simpleGroupStates, this.simpleGroups);
			setCollapseGroupState(typeGroupStates, this.typeGroups);
		} else {
			this.workspaceGroups.forEach((workspaceGroup) => workspaceGroup.collapsed = initialState === 'Collapsed');
			this.simpleGroups.forEach((group) => group.collapsed = initialState === 'Collapsed');
			this.typeGroups.forEach((group) => group.collapsed = initialState === 'Collapsed');
		}
		
	}
	
	public dispose () {
		
		this.disposables.forEach((disposable) => disposable.dispose());
		
	}
	
	public showColorPicker (project:Project) {
		
		this.colorPickerProject = project;
		this.refresh();
		
	}
	
	public hideColorPicker () {
		
		this.colorPickerProject = null;
		this.refresh();
		
	}
	
	public refresh (states?:RefreshWorkspacesStates) {
		
		if (states?.task) this.refreshTask = states.task;
		if (states?.workspaces) this.workspaces = states.workspaces;
		if (states?.workspaceGroups) this.workspaceGroups = states.workspaceGroups;
		
		if (this.workspaces) this._onDidChangeTreeData.fire(undefined);
		
	}
	
	private addWorkspaceGroups (list:WorkspacesTreeItems[]) {
		
		const slots = this.slots;
		let paths:string[] = [];
		
		this.workspaceGroups.forEach((workspaceGroup) => {
			
			const slot = slots.getByGroup(workspaceGroup);;
			
			paths = paths.concat(workspaceGroup.paths);
			list.push(new WorkspaceGroupTreeItem(workspaceGroup, slot));
			
		});
		
	}
	
	private addNonWorkspaceGroupItems (list:WorkspacesTreeItems[], workspacePath:string) {
		
		let paths:string[] = [];
		
		this.workspaceGroups.forEach((workspaceGroup) => paths = paths.concat(workspaceGroup.paths));
		
		const colorPickerProject = this.colorPickerProject;
		const slots = this.slots;
		let hasCurrentWorkspace = false;
		
		this.workspaces.forEach((workspace) => {
			
			if (paths.includes(workspace.path)) return;
			
			const slot = slots.getByWorkspace(workspace);
			
			if (!hasCurrentWorkspace && workspacePath && workspacePath === workspace.path) {
				hasCurrentWorkspace = true;
				list.push(new CurrentWorkspaceTreeItem(workspace, slot));
			} else list.push(new ProjectTreeItem(workspace, slot));
			
			if (colorPickerProject?.path === workspace.path) {
				list.push(this.colorPickerTreeItem);
			}
			
		});
		
		if (workspacePath && !hasCurrentWorkspace) this.addUnknownItem(list, workspacePath);
		
	}
	
	private addWorkspaceGroupItems (list:WorkspacesTreeItems[], element:WorkspaceGroupTreeItem, workspacePath:string) {
		
		const paths = element.group.paths;
		const colorPickerProject = this.colorPickerProject;
		const slots = this.slots;
		let hasCurrentWorkspace = false;
		
		this.workspaces.forEach((workspace) => {
			
			if (!paths.includes(workspace.path)) return;
					
			const slot = slots.getByWorkspace(workspace);
			
			if (!hasCurrentWorkspace && workspacePath && workspacePath === workspace.path) {
				hasCurrentWorkspace = true;
				list.push(new CurrentWorkspaceTreeItem(workspace, slot, true));
			} else list.push(new ProjectTreeItem(workspace, slot, true));
			
			if (colorPickerProject && colorPickerProject.path === workspace.path) {
				list.push(this.colorPickerTreeItem);
			}
			
		});
		
	}
	
	private addSimpleGroups (list:WorkspacesTreeItems[], workspacePath:string) {
		
		const isUnknownWorkspace = this.isUnknownWorkspace(workspacePath);
		let paths:string[] = [];
		
		this.workspaceGroups.forEach((workspaceGroup) => paths = paths.concat(workspaceGroup.paths));
		
		const noGroupWorkspaces = this.workspaces.filter((workspace) => !paths.includes(workspace.path));
		
		this.simpleGroups.forEach((group) => {
			
			if (noGroupWorkspaces.some((workspace) => group.projectTypes.includes(workspace.type)) || group.type === 'project' && isUnknownWorkspace) {
				list.push(new SimpleGroupTreeItem(group));
			}
			
		});
		
	}
	
	private addSimpleGroupItems (list:WorkspacesTreeItems[], element:SimpleGroupTreeItem, workspacePath:string) {
		
		const type = element.group.type;
		const colorPickerProject = this.colorPickerProject;
		const slots = this.slots;
		let hasCurrentWorkspace = false;
		let paths:string[] = [];
		
		this.workspaceGroups.forEach((workspaceGroup) => paths = paths.concat(workspaceGroup.paths));
		
		this.workspaces.forEach((workspace) => {
			
			if (paths.includes(workspace.path)) return;
						
			let simpleType = null;
			
			switch (workspace.type) {
				case 'folder':
				case 'folders':
					simpleType = 'project';
					break;
				case 'git':
					simpleType = 'git';
					break;
				case 'vscode':
				case 'workspace':
					simpleType = 'vscode';
					break;
				case 'subfolder':
					simpleType = 'subfolder';
					break;
			}
		
			if (type === simpleType) {
				const slot = slots.getByWorkspace(workspace);
				if (!hasCurrentWorkspace && workspacePath && workspacePath === workspace.path) {
					hasCurrentWorkspace = true;
					list.push(new CurrentWorkspaceTreeItem(workspace, slot));
				} else list.push(new ProjectTreeItem(workspace, slot));
				if (colorPickerProject && simpleType === 'project' && colorPickerProject.path === workspace.path) {
					list.push(this.colorPickerTreeItem);
				}
			}
			
		});
		
		if ((type === 'project') && !hasCurrentWorkspace && this.isUnknownWorkspace(workspacePath)) {
			this.addUnknownItem(list, workspacePath);
		}
		
	}
	
	private addTypeGroups (list:WorkspacesTreeItems[], workspacePath:string) {
		
		const isUnknownWorkspace = this.isUnknownWorkspace(workspacePath);
		const isCodeWorkspace = workspaces.isCodeWorkspace(workspacePath);
		let paths:string[] = [];
		
		this.workspaceGroups.forEach((workspaceGroup) => paths = paths.concat(workspaceGroup.paths));
		
		const noGroupWorkspaces = this.workspaces.filter((workspace) => !paths.includes(workspace.path));
		
		this.typeGroups.forEach((group) => {
			
			if (noGroupWorkspaces.some((workspace) => workspace.type === group.type
			|| group.type === 'folder' && isUnknownWorkspace && !isCodeWorkspace
			|| group.type === 'folders' && isUnknownWorkspace && isCodeWorkspace)) {
				list.push(new TypeGroupTreeItem(group));
			}
			
		});
		
	}
	
	private addTypeGroupItems (list:WorkspacesTreeItems[], element:TypeGroupTreeItem, workspacePath:string) {
		
		const type = element.group.type;
		const colorPickerProject = this.colorPickerProject;
		const workspaceFile = vscode.workspace.workspaceFile;
		const slots = this.slots;
		let hasCurrentWorkspace = false;
		let paths:string[] = [];
		
		this.workspaceGroups.forEach((workspaceGroup) => paths = paths.concat(workspaceGroup.paths));
		
		this.workspaces.forEach((workspace) => {
			
			if (paths.includes(workspace.path)) return;
					
			if (type === workspace.type) {
				const slot = slots.getByWorkspace(workspace);
				
				if (!hasCurrentWorkspace && workspacePath && workspacePath === workspace.path) {
					hasCurrentWorkspace = true;
					list.push(new CurrentWorkspaceTreeItem(workspace, slot));
				} else list.push(new ProjectTreeItem(workspace, slot));
				
				if (colorPickerProject && (type === 'folder' || type === 'folders') && colorPickerProject.path === workspace.path) {
					list.push(this.colorPickerTreeItem);
				}
			}
			
		});
		
		if ((type === 'folder' && !workspaceFile || type === 'folders' && workspaceFile)
		&& !hasCurrentWorkspace && this.isUnknownWorkspace(workspacePath)) {
			this.addUnknownItem(list, workspacePath);
		}
		
	}
	
	private addUnknownItem (list:WorkspacesTreeItems[], workspacePath:string) {
		
		list.unshift(new UnknownProjectTreeItem({
			label: formatLabel(workspacePath),
			path: workspacePath,
			type: workspaces.isCodeWorkspace(workspacePath) ? 'folders' : 'folder',
		}));
		
	}
	
	public getParent (element:WorkspacesTreeItems) {
		
		return Promise.resolve(undefined);
		
	}
	
	public getTreeItem (element:ProjectTreeItem) :vscode.TreeItem {
		
		return element;
		
	}
	
	public async getChildren (element?:WorkspacesTreeItems) {
		
		const list:WorkspacesTreeItems[] = [];
		
		if (this.refreshTask) {
			this.workspaces = await this.refreshTask();
			this.refreshTask = null;
		} else if (!this.workspaces) {
			this._onWillInitView.fire(undefined);
			return list;
		}
		
		const workspacePath:string = workspaces.getCurrentWorkspacePath();
		const sortWorkspacesBy = this.sortWorkspacesBy;
		
		if (element) {
			if (element instanceof WorkspaceGroupTreeItem) this.addWorkspaceGroupItems(list, element, workspacePath);
			else if (element instanceof SimpleGroupTreeItem) this.addSimpleGroupItems(list, element, workspacePath);
			else if (element instanceof TypeGroupTreeItem) this.addTypeGroupItems(list, element, workspacePath);
		} else {
			this.addWorkspaceGroups(list);
			if (sortWorkspacesBy === 'Simple') this.addSimpleGroups(list, workspacePath);
			else if (sortWorkspacesBy === 'Type') this.addTypeGroups(list, workspacePath);
			else this.addNonWorkspaceGroupItems(list, workspacePath);
		}
		
		return list;
		
	}
	
	private isUnknownWorkspace (workspacePath:string) {
		
		if (!workspacePath) return false;
		
		return !this.workspaces.some((project) => workspacePath === project.path);
		
	}
	
}

//	Functions __________________________________________________________________

function setCollapseGroupState (groupStates:(SimpleGroupState|TypeGroupState)[], groups:(SimpleGroup|TypeGroupState)[]) {
	
	for (const state of groupStates) {
		for (const group of groups) {
			if (state.type === group.type) {
				group.collapsed = state.collapsed;
				break;
			}
		}
	}
	
}