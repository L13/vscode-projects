//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { formatLabel } from '../@l13/formats';

import { InitialState, WorkspaceSorting } from '../@types/common';
import {
	GroupSimple,
	GroupTreeItem,
	GroupType,
	Project,
	RefreshWorkspacesStates,
	WorkspaceGroup,
	WorkspacesStates,
	WorkspacesTreeItems,
} from '../@types/workspaces';

import * as settings from '../common/settings';

import { ColorPickerTreeItem } from './trees/ColorPickerTreeItem';
import { CurrentProjectTreeItem } from './trees/CurrentProjectTreeItem';
import { GroupCustomTreeItem } from './trees/GroupCustomTreeItem';
import { GroupSimpleTreeItem } from './trees/GroupSimpleTreeItem';
import { GroupTypeTreeItem } from './trees/GroupTypeTreeItem';
import { ProjectTreeItem } from './trees/ProjectTreeItem';
import { UnknownProjectTreeItem } from './trees/UnknownProjectTreeItem';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class WorkspacesProvider implements vscode.TreeDataProvider<WorkspacesTreeItems> {
	
	public static currentWorkspacesProvider:WorkspacesProvider;
	
	public static createWorkspacesProvider (states:WorkspacesStates, colorPicker:ColorPickerTreeItem) {
		
		return WorkspacesProvider.currentWorkspacesProvider || (WorkspacesProvider.currentWorkspacesProvider = new WorkspacesProvider(states, colorPicker));
		
	}
	
	private _onDidChangeTreeData:vscode.EventEmitter<WorkspacesTreeItems|undefined> = new vscode.EventEmitter<WorkspacesTreeItems|undefined>();
	public readonly onDidChangeTreeData:vscode.Event<WorkspacesTreeItems|undefined> = this._onDidChangeTreeData.event;
	
	private disposables:vscode.Disposable[] = [];
	
	public sortWorkspacesBy:WorkspaceSorting = settings.get('sortWorkspacesBy');
	
	public workspaceGroups:WorkspaceGroup[] = [];
	
	private cache:Project[] = null;
	
	private groupTypes:GroupType[] = [
		{ label: 'Projects', type: 'folder', collapsed: false },
		{ label: 'Project Workspaces', type: 'folders', collapsed: false },
		{ label: 'Git', type: 'git', collapsed: false },
		{ label: 'Visual Studio Code', type: 'vscode', collapsed: false },
		{ label: 'Workspaces', type: 'workspace', collapsed: false },
		{ label: 'Subfolders', type: 'subfolder', collapsed: false },
	];
	
	private groupSimples:GroupSimple[] = [
		{ label: 'Projects', type: 'project', projectTypes: ['folder', 'folders'], collapsed: false },
		{ label: 'Git', type: 'git', projectTypes: ['git'], collapsed: false },
		{ label: 'Visual Studio Code', type: 'vscode', projectTypes: ['vscode', 'workspace'], collapsed: false },
		{ label: 'Subfolders', type: 'subfolder', projectTypes: ['subfolder'], collapsed: false },
	];
	
	private constructor (private readonly states:WorkspacesStates, private colorPicker:ColorPickerTreeItem) {
		
		if (settings.get('useCacheForDetectedProjects', false)) {
			this.cache = states.workspaces.getWorkspacesCache();
		}
		
		this.workspaceGroups = states.workspaceGroups.getWorkspaceGroups();
		
		const groupSimpleStates = states.workspaceGroups.getSimpleGroups();
		const groupTypeStates = states.workspaceGroups.getTypeGroups();
		const initialState:InitialState = settings.get('initialWorkspacesGroupState', 'Remember');
		
		if (initialState === 'Remember') {
			groupTypeStates.forEach((state) => {
				
				this.groupTypes.some((group) => {
					
					if (state.type === group.type) {
						group.collapsed = state.collapsed;
						return true;
					}
					
				});
				
			});
			groupSimpleStates.forEach((state) => {
				
				this.groupSimples.some((group) => {
					
					if (state.type === group.type) {
						group.collapsed = state.collapsed;
						return true;
					}
					
				});
				
			});
		} else {
			this.workspaceGroups.forEach((workspaceGroup) => workspaceGroup.collapsed = initialState === 'Collapsed');
			this.groupTypes.forEach((group) => group.collapsed = initialState === 'Collapsed');
			this.groupSimples.forEach((group) => group.collapsed = initialState === 'Collapsed');
		}
		
	}
	
	public dispose () {
		
		this.disposables.forEach((disposable) => disposable.dispose());
		
	}
	
	public showColorPicker (project:Project) {
		
		this.colorPicker.project = project;
		this.refresh();
		
	}
	
	public hideColorPicker () {
		
		this.colorPicker.project = null;
		this.refresh();
		
	}
	
	public refresh (refreshStates?:RefreshWorkspacesStates) {
		
		if (refreshStates?.workspaces) this.cache = this.states.workspaces.getWorkspacesCache();
		if (refreshStates?.workspaceGroups) this.workspaceGroups = this.states.workspaceGroups.getWorkspaceGroups();
		
		this._onDidChangeTreeData.fire();
		
	}
	
	private addCustomGroups (list:WorkspacesTreeItems[]) {
		
		const slots = this.states.hotkeySlots;
		let paths:string[] = [];
		
		this.workspaceGroups.forEach((workspaceGroup) => {
			
			const slot = slots.getGroup(workspaceGroup);;
			
			paths = paths.concat(workspaceGroup.paths);
			list.push(new GroupCustomTreeItem(workspaceGroup, slot));
			
		});
		
	}
	
	private addNonCustomGroupItems (list:WorkspacesTreeItems[], workspacePath:string) {
		
		let paths:string[] = [];
		
		this.workspaceGroups.forEach((workspaceGroup) => paths = paths.concat(workspaceGroup.paths));
		
		const colorPickerProject = this.colorPicker.project;
		const slots = this.states.hotkeySlots;
		let hasCurrentWorkspace = false;
		
		this.cache.forEach((workspace) => {
			
			if (paths.includes(workspace.path)) return;
			
			const slot = slots.get(workspace);
			
			if (!hasCurrentWorkspace && workspacePath && workspacePath === workspace.path) {
				hasCurrentWorkspace = true;
				list.push(new CurrentProjectTreeItem(workspace, slot));
			} else list.push(new ProjectTreeItem(workspace, slot));
			
			if (colorPickerProject?.path === workspace.path) {
				list.push(this.colorPicker);
			}
			
		});
		
		if (workspacePath && !hasCurrentWorkspace) this.addUnknownItem(list, workspacePath);
		
	}
	
	private addCustomGroupItems (list:WorkspacesTreeItems[], paths:string[], workspacePath:string) {
		
		const colorPickerProject = this.colorPicker.project;
		const slots = this.states.hotkeySlots;
		let hasCurrentWorkspace = false;
		
		this.cache.forEach((workspace) => {
			
			if (!paths.includes(workspace.path)) return;
					
			const slot = slots.get(workspace);
			
			if (!hasCurrentWorkspace && workspacePath && workspacePath === workspace.path) {
				hasCurrentWorkspace = true;
				list.push(new CurrentProjectTreeItem(workspace, slot, true));
			} else list.push(new ProjectTreeItem(workspace, slot, true));
			
			if (colorPickerProject && colorPickerProject.path === workspace.path) {
				list.push(this.colorPicker);
			}
			
		});
		
	}
	
	private addSimpleGroups (list:WorkspacesTreeItems[], workspacePath:string) {
		
		const isUnknownWorkspace = this.isUnknownWorkspace(workspacePath);
		
		this.groupSimples.forEach((group) => {
			
			if (this.cache.some((workspace) => group.projectTypes.includes(workspace.type)) || group.type === 'project' && isUnknownWorkspace) {
				list.push(new GroupSimpleTreeItem(group));
			}
			
		});
		
	}
	
	private addSimpleGroupItems (list:WorkspacesTreeItems[], type:string, workspacePath:string) {
		
		const colorPickerProject = this.colorPicker.project;
		const slots = this.states.hotkeySlots;
		let hasCurrentWorkspace = false;
		let paths:string[] = [];
		
		this.workspaceGroups.forEach((workspaceGroup) => paths = paths.concat(workspaceGroup.paths));
		
		this.cache.forEach((workspace) => {
			
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
				const slot = slots.get(workspace);
				if (!hasCurrentWorkspace && workspacePath && workspacePath === workspace.path) {
					hasCurrentWorkspace = true;
					list.push(new CurrentProjectTreeItem(workspace, slot));
				} else list.push(new ProjectTreeItem(workspace, slot));
				if (colorPickerProject && simpleType === 'project' && colorPickerProject.path === workspace.path) {
					list.push(this.colorPicker);
				}
			}
			
		});
		
		if ((type === 'project') && !hasCurrentWorkspace && this.isUnknownWorkspace(workspacePath)) {
			this.addUnknownItem(list, workspacePath);
		}
		
	}
	
	private addTypeGroups (list:WorkspacesTreeItems[], workspacePath:string) {
		
		const isUnknownWorkspace = this.isUnknownWorkspace(workspacePath);
		const isCodeWorkspace = settings.isCodeWorkspace(workspacePath);
		
		this.groupTypes.forEach((group) => {
			
			if (this.cache.some((workspace) => workspace.type === group.type
			|| group.type === 'folder' && isUnknownWorkspace && !isCodeWorkspace
			|| group.type === 'folders' && isUnknownWorkspace && isCodeWorkspace)) {
				list.push(new GroupTypeTreeItem(group));
			}
			
		});
		
	}
	
	private addTypeGroupItems (list:WorkspacesTreeItems[], type:string, workspacePath:string) {
		
		const colorPickerProject = this.colorPicker.project;
		const workspaceFile = vscode.workspace.workspaceFile;
		const slots = this.states.hotkeySlots;
		let hasCurrentWorkspace = false;
		let paths:string[] = [];
		
		this.workspaceGroups.forEach((workspaceGroup) => paths = paths.concat(workspaceGroup.paths));
		
		this.cache.forEach((workspace) => {
			
			if (paths.includes(workspace.path)) return;
					
			if (type === workspace.type) {
				const slot = slots.get(workspace);
				
				if (!hasCurrentWorkspace && workspacePath && workspacePath === workspace.path) {
					hasCurrentWorkspace = true;
					list.push(new CurrentProjectTreeItem(workspace, slot));
				} else list.push(new ProjectTreeItem(workspace, slot));
				
				if (colorPickerProject && (type === 'folder' || type === 'folders') && colorPickerProject.path === workspace.path) {
					list.push(this.colorPicker);
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
			type: settings.isCodeWorkspace(workspacePath) ? 'folders' : 'folder',
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
		
		if (!this.cache) {
			this.states.workspaces.detectWorkspaces();
			return list;
		}
		
		const workspacePath:string = settings.getCurrentWorkspacePath();
		const sortWorkspacesBy = this.sortWorkspacesBy;
		
		if (element) {
			const type = (<GroupTreeItem>element).group.type;
			if (type === 'custom') this.addCustomGroupItems(list, (<GroupCustomTreeItem>element).group.paths, workspacePath);
			else if (sortWorkspacesBy === 'Simple') this.addSimpleGroupItems(list, type, workspacePath);
			else this.addTypeGroupItems(list, type, workspacePath);
		} else {
			this.addCustomGroups(list);
			if (sortWorkspacesBy === 'Simple') this.addSimpleGroups(list, workspacePath);
			else if (sortWorkspacesBy === 'Type') this.addTypeGroups(list, workspacePath);
			else this.addNonCustomGroupItems(list, workspacePath);
		}
		
		return list;
		
	}
	
	private isUnknownWorkspace (workspacePath:string) {
		
		if (!workspacePath) return false;
		
		return !this.cache.some((project) => workspacePath === project.path);
		
	}
	
	public static addToWorkspace (project:Project) {
		
		const index:number = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0;
		
		vscode.workspace.updateWorkspaceFolders(index, null, {
			name: project.label,
			uri: vscode.Uri.file(project.path),
		});
		
	}
	
}

//	Functions __________________________________________________________________

