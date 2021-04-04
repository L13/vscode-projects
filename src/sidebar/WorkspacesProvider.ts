//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { formatGroupDescription, formatLabel, formatTagDescription, formatWorkspaceDescription } from '../@l13/formats';

import { GroupDescriptionFormat, InitialState, TagDescriptionFormat, WorkspaceDescriptionFormat, WorkspaceSorting } from '../@types/common';
import { Tag, TagGroup } from '../@types/tags';
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

import { SimpleGroupTreeItem } from './trees/groups/SimpleGroupTreeItem';
import { TagGroupTreeItem } from './trees/groups/TagGroupTreeItem';
import { TypeGroupTreeItem } from './trees/groups/TypeGroupTreeItem';
import { WorkspaceGroupTreeItem } from './trees/groups/WorkspaceGroupTreeItem';
import { ColorPickerTreeItem } from './trees/items/ColorPickerTreeItem';
import { CurrentWorkspaceTreeItem } from './trees/items/CurrentWorkspaceTreeItem';
import { ProjectTreeItem } from './trees/items/ProjectTreeItem';
import { TagTreeItem } from './trees/items/TagTreeItem';
import { UnknownProjectTreeItem } from './trees/items/UnknownProjectTreeItem';

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
	
	public sortWorkspacesBy:WorkspaceSorting = settings.sortWorkspacesBy(); // Backwards compatability
	
	public workspaceDescriptionFormat:WorkspaceDescriptionFormat = settings.get('workspaceDescriptionFormat');
	public tagDescriptionFormat:TagDescriptionFormat = settings.get('tagDescriptionFormat');
	public groupDescriptionFormat:GroupDescriptionFormat = settings.get('groupDescriptionFormat');
	
	public showTagsInWorkspaces:boolean = settings.get('showTagsInWorkspaces', false);
	
	private workspaces:Project[] = null;
	private workspaceGroups:WorkspaceGroup[] = [];
	
	private tags:Tag[] = [];
	
	private slots:HotkeySlotsState = null;
	
	public readonly colorPickerTreeItem = new ColorPickerTreeItem();
	
	public colorPickerProject:Project = null;
	
	private tagGroup:TagGroup = {
		label: 'Tags',
		collapsed: false
	};
	
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
	
	private constructor ({ hotkeySlots, workspaces, workspaceGroups, tags, simpleGroups, tagGroup, typeGroups }:WorkspacesStates) {
		
		this.workspaces = workspaces;
		this.workspaceGroups = workspaceGroups;
		
		this.tags = tags;
		
		this.slots = hotkeySlots;
		
		const initialState:InitialState = settings.get('initialWorkspaceGroupsState', 'remember');
		
		if (initialState === 'remember') {
			this.tagGroup.collapsed = tagGroup?.collapsed ?? false;
			setCollapseGroupState(simpleGroups, this.simpleGroups);
			setCollapseGroupState(typeGroups, this.typeGroups);
		} else {
			this.workspaceGroups.forEach((workspaceGroup) => workspaceGroup.collapsed = initialState === 'collapsed');
			this.simpleGroups.forEach((group) => group.collapsed = initialState === 'collapsed');
			this.typeGroups.forEach((group) => group.collapsed = initialState === 'collapsed');
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
		
		if (states?.tags) this.tags = states.tags;
		if (states?.workspaces) this.workspaces = states.workspaces;
		if (states?.workspaceGroups) this.workspaceGroups = states.workspaceGroups;
		
		if (this.workspaces) this._onDidChangeTreeData.fire(undefined);
		
	}
	
	private addTagGroup (list:WorkspacesTreeItems[]) {
		
		list.push(new TagGroupTreeItem(this.tagGroup));
		
	}
	
	private addTagGroupItems (list:WorkspacesTreeItems[]) {
		
		const slots = this.slots;
		const tagDescriptionFormat = this.tagDescriptionFormat;
		
		this.tags.forEach((tag) => {
			
			const slot = slots.getByTag(tag);
			const description = formatTagDescription(tag, slot, tagDescriptionFormat);
			
			list.push(new TagTreeItem(tag, description));
			
		});
		
	}
	
	private addWorkspaceGroups (list:WorkspacesTreeItems[]) {
		
		const slots = this.slots;
		let paths:string[] = [];
		
		this.workspaceGroups.forEach((workspaceGroup) => {
			
			const slot = slots.getByGroup(workspaceGroup);
			const description = formatGroupDescription(workspaceGroup.paths.length, slot, this.groupDescriptionFormat);
			
			paths = paths.concat(workspaceGroup.paths);
			list.push(new WorkspaceGroupTreeItem(workspaceGroup, description));
			
		});
		
	}
	
	private addNonWorkspaceGroupItems (list:WorkspacesTreeItems[], workspacePath:string) {
		
		let paths:string[] = [];
		
		this.workspaceGroups.forEach((workspaceGroup) => paths = paths.concat(workspaceGroup.paths));
		
		const colorPickerProject = this.colorPickerProject;
		const slots = this.slots;
		const tags = this.tags;
		const workspaceDescriptionFormat = this.workspaceDescriptionFormat;
		let hasCurrentWorkspace = false;
		
		this.workspaces.forEach((workspace) => {
			
			if (paths.includes(workspace.path)) return;
			
			const slot = slots.getByWorkspace(workspace);
			const description = formatWorkspaceDescription(workspace, slot, tags, workspaceDescriptionFormat);
			
			if (!hasCurrentWorkspace && workspacePath && workspacePath === workspace.path) {
				hasCurrentWorkspace = true;
				list.push(new CurrentWorkspaceTreeItem(workspace, description));
			} else list.push(new ProjectTreeItem(workspace, description));
			
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
		const tags = this.tags;
		const workspaceDescriptionFormat = this.workspaceDescriptionFormat;
		let hasCurrentWorkspace = false;
		
		this.workspaces.forEach((workspace) => {
			
			if (!paths.includes(workspace.path)) return;
					
			const slot = slots.getByWorkspace(workspace);
			const description = formatWorkspaceDescription(workspace, slot, tags, workspaceDescriptionFormat);
			
			if (!hasCurrentWorkspace && workspacePath && workspacePath === workspace.path) {
				hasCurrentWorkspace = true;
				list.push(new CurrentWorkspaceTreeItem(workspace, description, true));
			} else list.push(new ProjectTreeItem(workspace, description, true));
			
			if (colorPickerProject && colorPickerProject.path === workspace.path) {
				list.push(this.colorPickerTreeItem);
			}
			
		});
		
	}
	
	private addSimpleGroups (list:WorkspacesTreeItems[], workspacePath:string) {
		
		const isUnknownWorkspace = this.isUnknownWorkspace(workspacePath);
		const groupDescriptionFormat = this.groupDescriptionFormat;
		let paths:string[] = [];
		
		this.workspaceGroups.forEach((workspaceGroup) => paths = paths.concat(workspaceGroup.paths));
		
		const noGroupWorkspaces = this.workspaces.filter((workspace) => !paths.includes(workspace.path));
		
		this.simpleGroups.forEach((group) => {
			
			let amount = noGroupWorkspaces.filter((workspace) => group.projectTypes.includes(workspace.type)).length;
			
			if (group.type === 'project' && isUnknownWorkspace) amount++;
			
			if (amount) {
				const description = formatGroupDescription(amount, null, groupDescriptionFormat);
				list.push(new SimpleGroupTreeItem(group, description));
			}
			
		});
		
	}
	
	private addSimpleGroupItems (list:WorkspacesTreeItems[], element:SimpleGroupTreeItem, workspacePath:string) {
		
		const type = element.group.type;
		const colorPickerProject = this.colorPickerProject;
		const slots = this.slots;
		const tags = this.tags;
		const workspaceDescriptionFormat = this.workspaceDescriptionFormat;
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
				const description = formatWorkspaceDescription(workspace, slot, tags, workspaceDescriptionFormat);
				if (!hasCurrentWorkspace && workspacePath && workspacePath === workspace.path) {
					hasCurrentWorkspace = true;
					list.push(new CurrentWorkspaceTreeItem(workspace, description));
				} else list.push(new ProjectTreeItem(workspace, description));
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
		const groupDescriptionFormat = this.groupDescriptionFormat;
		let paths:string[] = [];
		
		this.workspaceGroups.forEach((workspaceGroup) => paths = paths.concat(workspaceGroup.paths));
		
		const noGroupWorkspaces = this.workspaces.filter((workspace) => !paths.includes(workspace.path));
		
		this.typeGroups.forEach((group) => {
			
			let amount = noGroupWorkspaces.filter((workspace) => workspace.type === group.type).length;
			
			if (group.type === 'folder' && isUnknownWorkspace && !isCodeWorkspace) amount++;
			if (group.type === 'folders' && isUnknownWorkspace && isCodeWorkspace) amount++;
			
			if (amount) {
				const description = formatGroupDescription(amount, null, groupDescriptionFormat);
				list.push(new TypeGroupTreeItem(group, description));
			}
			
		});
		
	}
	
	private addTypeGroupItems (list:WorkspacesTreeItems[], element:TypeGroupTreeItem, workspacePath:string) {
		
		const type = element.group.type;
		const colorPickerProject = this.colorPickerProject;
		const workspaceFile = vscode.workspace.workspaceFile;
		const slots = this.slots;
		const tags = this.tags;
		const workspaceDescriptionFormat = this.workspaceDescriptionFormat;
		let hasCurrentWorkspace = false;
		let paths:string[] = [];
		
		this.workspaceGroups.forEach((workspaceGroup) => paths = paths.concat(workspaceGroup.paths));
		
		this.workspaces.forEach((workspace) => {
			
			if (paths.includes(workspace.path)) return;
					
			if (type === workspace.type) {
				const slot = slots.getByWorkspace(workspace);
				const description = formatWorkspaceDescription(workspace, slot, tags, workspaceDescriptionFormat);
				
				if (!hasCurrentWorkspace && workspacePath && workspacePath === workspace.path) {
					hasCurrentWorkspace = true;
					list.push(new CurrentWorkspaceTreeItem(workspace, description));
				} else list.push(new ProjectTreeItem(workspace, description));
				
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
		
		if (!this.workspaces) {
			this._onWillInitView.fire(undefined);
			return list;
		}
		
		const workspacePath:string = workspaces.getCurrentWorkspacePath();
		
		if (element) {
			if (element instanceof WorkspaceGroupTreeItem) this.addWorkspaceGroupItems(list, element, workspacePath);
			else if (element instanceof SimpleGroupTreeItem) this.addSimpleGroupItems(list, element, workspacePath);
			else if (element instanceof TypeGroupTreeItem) this.addTypeGroupItems(list, element, workspacePath);
			else if (element instanceof TagGroupTreeItem) this.addTagGroupItems(list);
		} else {
			const sortWorkspacesBy = this.sortWorkspacesBy;
			if (this.showTagsInWorkspaces) this.addTagGroup(list);
			this.addWorkspaceGroups(list);
			if (sortWorkspacesBy === 'category') this.addSimpleGroups(list, workspacePath);
			else if (sortWorkspacesBy === 'type') this.addTypeGroups(list, workspacePath);
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