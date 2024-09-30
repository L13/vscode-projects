//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { Dictionary } from '../@types/basics';
import type {
	GroupDescriptionFormat,
	InitialState,
	TagDescriptionFormat,
	WorkspaceDescriptionFormat,
	WorkspaceSorting,
} from '../@types/common';
import type { Tag } from '../@types/tags';
import type {
	Project,
	RefreshWorkspacesStates,
	WorkspaceGroup,
	WorkspacesStates,
	WorkspacesTreeItems,
} from '../@types/workspaces';
import type { StaticSorter, WorkspacesSorter } from '../@types/WorkspacesSorter';

import * as settings from '../common/settings';
import * as workspaces from '../common/workspaces';

import { ProjectsState } from '../states/ProjectsState';
import { HotkeySlotsState } from '../states/HotkeySlotsState';

import { ColorPickerTreeItem } from './trees/items/ColorPickerTreeItem';
import { WorkspaceTreeItem } from './trees/items/WorkspaceTreeItem';
import { UnknownProjectTreeItem } from './trees/items/UnknownProjectTreeItem';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class WorkspacesProvider implements vscode.TreeDataProvider<WorkspacesTreeItems> {
	
	public static current: WorkspacesProvider;
	
	public static create (states: WorkspacesStates) {
		
		return WorkspacesProvider.current || (WorkspacesProvider.current = new WorkspacesProvider(states));
		
	}
	
	private _onDidChangeTreeData: vscode.EventEmitter<WorkspacesTreeItems|undefined> = new vscode.EventEmitter<WorkspacesTreeItems|undefined>();
	public readonly onDidChangeTreeData: vscode.Event<WorkspacesTreeItems|undefined> = this._onDidChangeTreeData.event;
	
	private _onWillInitView: vscode.EventEmitter<WorkspacesTreeItems|undefined> = new vscode.EventEmitter<WorkspacesTreeItems|undefined>();
	public readonly onWillInitView: vscode.Event<WorkspacesTreeItems|undefined> = this._onWillInitView.event;
	
	private disposables: vscode.Disposable[] = [];
	
	public sortWorkspacesBy: WorkspaceSorting = settings.sortWorkspacesBy(); // Backwards compatability
	
	public workspaceDescriptionFormat: WorkspaceDescriptionFormat = settings.get('workspaceDescriptionFormat');
	public tagDescriptionFormat: TagDescriptionFormat = settings.get('tagDescriptionFormat');
	public groupDescriptionFormat: GroupDescriptionFormat = settings.get('groupDescriptionFormat');
	
	public showTagsInWorkspaces: boolean = settings.get('showTagsInWorkspaces', false);
	
	public readonly initialState: InitialState = settings.get('initialWorkspaceGroupsState', 'remember');
	
	private groupElementRefs: Map<any, StaticSorter|WorkspacesSorter> = new Map();
	private staticSorters: StaticSorter[] = [];
	private sorters: Dictionary<WorkspacesSorter> = Object.create(null);
	
	public workspacePath = '';
	public isUnknownWorkspace = true;
	
	public workspaces: Project[] = null;
	public workspaceGroups: WorkspaceGroup[] = [];
	
	public workspacesInGroups: Project[] = [];
	public noGroupWorkspaces: Project[] = [];
	
	public tags: Tag[] = [];
	public slots: HotkeySlotsState = null;
	
	public colorPickerProject: Project = null;
	public readonly colorPickerTreeItem = new ColorPickerTreeItem();
	
	private constructor ({ hotkeySlots, workspaces: cache, workspaceGroups, tags }: WorkspacesStates) {
		
		this.tags = tags;
		this.slots = hotkeySlots;
		this.workspaces = cache;
		this.workspaceGroups = workspaceGroups;
		
	}
	
	public dispose () {
		
		this.disposables.forEach((disposable) => disposable.dispose());
		
	}
	
	public refresh (states?: RefreshWorkspacesStates) {
		
		if (states?.tags) this.tags = states.tags;
		if (states?.workspaces) this.workspaces = states.workspaces;
		if (states?.workspaceGroups) this.workspaceGroups = states.workspaceGroups;
		
		if (this.workspaces) this._onDidChangeTreeData.fire(undefined);
		
	}
	
	public showColorPicker (selectedProject: Project) {
		
		if (!ProjectsState.isLocalProject(selectedProject)) return;
		
		this.colorPickerProject = selectedProject;
		
		this.refresh();
		
	}
	
	public hideColorPicker () {
		
		this.colorPickerProject = null;
		
		this.refresh();
		
	}
	
	public addStaticSorter (sorter: StaticSorter) {
		
		this.staticSorters.push(sorter);
		
		sorter.groupRefs.forEach((ref) => this.groupElementRefs.set(ref, sorter));
		
	}
	
	public addWorkspacesSorter (sorter: WorkspacesSorter) {
		
		this.sorters[sorter.name] = sorter;
		
		sorter.groupRefs.forEach((ref) => this.groupElementRefs.set(ref, sorter));
		
	}
	
	private getSorterByName (name: WorkspaceSorting) {
		
		return this.sorters[name];
		
	}
	
	public getParent () {
		
		return Promise.resolve(undefined);
		
	}
	
	public getTreeItem (element: WorkspaceTreeItem) {
		
		return element;
		
	}
	
	public getChildren (element?: WorkspacesTreeItems) {
		
		const list: WorkspacesTreeItems[] = [];
		
		if (!this.workspaces) {
			this._onWillInitView.fire(undefined);
			return list;
		}
		
		if (element) {
			this.groupElementRefs.get(element.constructor)?.addItems(list, element);
		} else {
			this.workspacePath = workspaces.getCurrentWorkspacePath();
			this.isUnknownWorkspace = this.hasUnknownWorkspace(this.workspacePath);
			this.staticSorters.forEach((sorter) => sorter.addGroups(list));
			this.getSorterByName(this.sortWorkspacesBy)?.addGroups(list);
		}
		
		return list;
		
	}
	
	private hasUnknownWorkspace (workspacePath: string) {
		
		if (!workspacePath) return false;
		
		return !this.workspaces.some((project) => workspacePath === project.path);
		
	}
	
	public addUnknownItem (list: WorkspacesTreeItems[]) {
		
		const workspacePath = this.workspacePath;
		
		if (workspacePath) list.unshift(new UnknownProjectTreeItem(workspaces.createWorkspaceItem(workspacePath)));
		
	}
	
}

//	Functions __________________________________________________________________

