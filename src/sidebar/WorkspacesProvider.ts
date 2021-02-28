//	Imports ____________________________________________________________________

import * as fs from 'fs';
import * as vscode from 'vscode';

import { sortCaseInsensitive } from '../@l13/arrays';
import { formatLabel } from '../@l13/formats';
import { subfolders, walktree } from '../@l13/fse';

import { FileMap, Options } from '../@types/files';
import { GroupCustomState, GroupSimple, GroupSimpleState, GroupTreeItem, GroupType, GroupTypeState, InitialState, WorkspaceSorting } from '../@types/groups';
import { Project, WorkspaceQuickPickItem, WorkspacesTreeItems, WorkspaceTypes } from '../@types/workspaces';

import * as settings from '../common/settings';
import * as states from '../common/states';

import { HotkeySlots } from '../states/HotkeySlots';
import { StatusBarColor } from '../states/StatusBarColor';

import { ColorPickerTreeItem } from './trees/ColorPickerTreeItem';
import { CurrentProjectTreeItem } from './trees/CurrentProjectTreeItem';
import { GroupCustomTreeItem } from './trees/GroupCustomTreeItem';
import { GroupSimpleTreeItem } from './trees/GroupSimpleTreeItem';
import { GroupTypeTreeItem } from './trees/GroupTypeTreeItem';
import { ProjectTreeItem } from './trees/ProjectTreeItem';
import { UnknownProjectTreeItem } from './trees/UnknownProjectTreeItem';

//	Variables __________________________________________________________________

const findGitFolder:RegExp = /^\.git$/;
const findVSCodeFolder:RegExp = /^\.vscode$/;

const GROUP_STATES_BY_TYPE = 'groupStatesByType';
const GROUP_STATES_BY_SIMPLE = 'groupStatesBySimple';
const GROUP_STATES_BY_GROUP = 'groupStatesByGroup';

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class WorkspacesProvider implements vscode.TreeDataProvider<WorkspacesTreeItems> {
	
	private _onDidChangeTreeData:vscode.EventEmitter<WorkspacesTreeItems|undefined> = new vscode.EventEmitter<WorkspacesTreeItems|undefined>();
	public readonly onDidChangeTreeData:vscode.Event<WorkspacesTreeItems|undefined> = this._onDidChangeTreeData.event;
	
	private disposables:vscode.Disposable[] = [];
	
	private initCache:boolean = true;
	private cache:Project[] = [];
	
	public sortWorkspacesBy:WorkspaceSorting = settings.get('sortWorkspacesBy');
	
	public projects:Project[] = [];
	public gitProjects:Project[] = [];
	public vscodeProjects:Project[] = [];
	public workspaceProjects:Project[] = [];
	public subfolderProjects:Project[] = [];
	
	public groupTypes:GroupType[] = [
		{ label: 'Projects', type: 'folder', collapsed: false },
		{ label: 'Project Workspaces', type: 'folders', collapsed: false },
		{ label: 'Git', type: 'git', collapsed: false },
		{ label: 'Visual Studio Code', type: 'vscode', collapsed: false },
		{ label: 'Workspaces', type: 'workspace', collapsed: false },
		{ label: 'Subfolders', type: 'subfolder', collapsed: false },
	];
	
	public groupSimples:GroupSimple[] = [
		{ label: 'Projects', type: 'project', projectTypes: ['folder', 'folders'], collapsed: false },
		{ label: 'Git', type: 'git', projectTypes: ['git'], collapsed: false },
		{ label: 'Visual Studio Code', type: 'vscode', projectTypes: ['vscode', 'workspace'], collapsed: false },
		{ label: 'Subfolders', type: 'subfolder', projectTypes: ['subfolder'], collapsed: false },
	];
	
	private slots:HotkeySlots = null;
	
	public static currentProvider:WorkspacesProvider;
	
	public static createProvider (context:vscode.ExtensionContext, colorPicker:ColorPickerTreeItem) {
		
		return WorkspacesProvider.currentProvider || (WorkspacesProvider.currentProvider = new WorkspacesProvider(context, colorPicker));
		
	}
	
	private constructor (private context:vscode.ExtensionContext, private colorPicker:ColorPickerTreeItem) {
		
		if (settings.get('useCacheForDetectedProjects')) {
			this.cache = context.globalState.get('cache') || [];
			this.gitProjects = context.globalState.get('cacheGitProjects') || [];
			this.vscodeProjects = context.globalState.get('cacheVSCodeProjects') || [];
			this.workspaceProjects = context.globalState.get('cacheWorkspaceProjects') || [];
			this.subfolderProjects = context.globalState.get('cacheSubfolderProjects') || [];
			this.initCache = false;
		}
		
		this.slots = HotkeySlots.create(this.context);
		
		const groupTypeStates:GroupTypeState[] = context.globalState.get(GROUP_STATES_BY_TYPE, []);
		const groupSimpleStates:GroupSimpleState[] = context.globalState.get(GROUP_STATES_BY_SIMPLE, []);
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
	
	private detectWorkspaces () {
		
		const gitFolders = settings.get('git.folders', []);
		const vscodeFolders = settings.get('vsCode.folders', []);
		const workspaceFolders = settings.get('workspace.folders', []);
		const subfolderFolders = settings.get('subfolder.folders', []);
		const promises:Promise<any>[] = [];
		
		return Promise.all(promises.concat(this.detectWorkspacesFor('cacheGitProjects', this.gitProjects = [], 'git', gitFolders, {
			find: findGitFolder,
			type: 'folder',
			maxDepth: settings.get('git.maxDepthRecursion', 1),
			ignore: settings.get('git.ignore', []),
		}), this.detectWorkspacesFor('cacheVSCodeProjects', this.vscodeProjects = [], 'vscode', vscodeFolders, {
			find: findVSCodeFolder,
			type: 'folder',
			maxDepth: settings.get('vsCode.maxDepthRecursion', 1),
			ignore: settings.get('vsCode.ignore', []),
		}), this.detectWorkspacesFor('cacheWorkspaceProjects', this.workspaceProjects = [], 'workspace', workspaceFolders, {
			find: settings.findExtWorkspace,
			type: 'file',
			maxDepth: settings.get('workspace.maxDepthRecursion', 1),
			ignore: settings.get('workspace.ignore', []),
		}), this.detectWorkspacesFor('cacheSubfolderProjects', this.subfolderProjects = [], 'subfolder', subfolderFolders, {
			find: null,
			type: 'folder',
			maxDepth: 1,
			ignore: settings.get('subfolder.ignore', []),
		}))).then(() => this.cleanupUnknownPaths());
		
	}
	
	public refreshWorkspaces () {
		
		StatusBarColor.detectProjectColors(this.context);
		this.detectWorkspaces();
		
	}
	
	public refresh () {
		
		this.updateCache();
		
		this._onDidChangeTreeData.fire();
		
	}
	
	private cleanupUnknownPaths () {
		
		const workspaceGroups = states.getWorkspaceGroups(this.context);
		const paths = this.cache.map((workspace) => workspace.path);
		
		workspaceGroups.forEach((workspaceGroup) => {
			
			workspaceGroup.paths = workspaceGroup.paths.filter((path) => paths.includes(path));
			
		});
		
		states.updateWorkspaceGroups(this.context, workspaceGroups);
		this.refresh();
		
	}
	
	private detectWorkspacesFor (name:string, workspaces:Project[], type:WorkspaceTypes, paths:string[], options:Options) {
		
		const promises:Promise<FileMap>[] = type === 'subfolder' ? createSubfolderDetection(paths, options) : createWorkspaceDetection(paths, options);
		
		if (promises.length) {
			return [Promise.all(promises).then((results) => {
				
				results.forEach((files) => {
					
					for (const file of Object.values(files)) {
						const pathname = file.path;
						workspaces.push({
							label: formatLabel(pathname),
							path: pathname,
							type,
						});
					}
					
				});
				
				workspaces.sort(({ label:a }:Project, { label:b }:Project) => sortCaseInsensitive(a, b));
				
				this.context.globalState.update(name, workspaces);
				this.refresh();
				
			}, (error) => { vscode.window.showErrorMessage(error.message); })];
		}
		
		this.refresh();
		
		return [];
		
	}
	
	private updateCache () {
		
		this.projects = states.getProjects(this.context);
		this.projects.forEach((project) => project.deleted = !fs.existsSync(project.path));
		
		const all = (<Project[]>[]).concat(this.projects, this.gitProjects, this.vscodeProjects, this.workspaceProjects, this.subfolderProjects);
		const once:{ [name:string]:Project } = {};
		
		all.forEach((workspace) => {
			
			if (once[workspace.path]) {
				const type = once[workspace.path].type;
				if (type === 'folder') return;
				if (workspace.type === 'folder') return once[workspace.path] = workspace;
				if (type === 'folders') return;
				if (workspace.type === 'folders') return once[workspace.path] = workspace;
				if (type === 'git') return;
				if (workspace.type === 'git') return once[workspace.path] = workspace;
				if (type === 'vscode') return;
				if (workspace.type === 'vscode') return once[workspace.path] = workspace;
				if (type === 'subfolder') return;
				if (workspace.type === 'subfolder') return once[workspace.path] = workspace;
			} else once[workspace.path] = workspace;
			
		});
		
		this.cache = Object.values(once).sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
		this.context.globalState.update('cache', this.cache);
		
	}
	
	private addCustomGroups (list:WorkspacesTreeItems[], workspacePath:string) {
		
		const workspaceGroups = states.getWorkspaceGroups(this.context);
		let paths:string[] = [];
		
		workspaceGroups.forEach((workspaceGroup) => {
			
			paths = paths.concat(workspaceGroup.paths);
			list.push(new GroupCustomTreeItem(workspaceGroup));
			
		});
		
		const colorPickerProject = this.colorPicker.project;
		const slots = this.slots;
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
		const slots = this.slots;
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
		const slots = this.slots;
		let hasCurrentWorkspace = false;
		
		this.cache.forEach((workspace) => {
						
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
		const slots = this.slots;
		let hasCurrentWorkspace = false;
		
		this.cache.forEach((workspace) => {
					
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
	
	private addItems (list:WorkspacesTreeItems[], workspacePath:string) {
		
		const colorPickerProject = this.colorPicker.project;
		const slots = this.slots;
		let hasCurrentWorkspace = false;
		
		this.cache.forEach((workspace) => {
			
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
	
	public getChildren (element?:WorkspacesTreeItems) {
		
		if (this.initCache) {
			this.updateCache();
			StatusBarColor.detectProjectColors(this.context);
			this.detectWorkspaces();
			this.initCache = false;
		}
		
		const workspacePath:string = settings.getCurrentWorkspacePath();
		const list:WorkspacesTreeItems[] = [];
		const sortWorkspacesBy = this.sortWorkspacesBy;
		
		if (sortWorkspacesBy !== 'Name') {
			if (element) {
				const type = (<GroupTreeItem>element).group.type;
				if (sortWorkspacesBy === 'Group') this.addCustomGroupItems(list, (<GroupCustomTreeItem>element).group.paths, workspacePath);
				else if (sortWorkspacesBy === 'Simple') this.addSimpleGroupItems(list, type, workspacePath);
				else this.addTypeGroupItems(list, type, workspacePath);
			} else {
				if (sortWorkspacesBy === 'Group') this.addCustomGroups(list, workspacePath);
				else if (sortWorkspacesBy === 'Simple') this.addSimpleGroups(list, workspacePath);
				else this.addTypeGroups(list, workspacePath);
			}
		} else this.addItems(list, workspacePath);
		
		return Promise.resolve(list);
		
	}
	
	public getWorkspaceByPath (fsPath:string) {
		
		for (const workspace of this.cache) {
			if (workspace.path === fsPath) return workspace;
		}
		
		return null;
		
	}
	
	private isUnknownWorkspace (workspacePath:string) {
		
		if (!workspacePath) return false;
		
		return !this.cache.some((project) => workspacePath === project.path);
		
	}
	
	public static addToWorkspace (project:Project) {
		
		const index:number = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0;
		
		vscode.workspace.updateWorkspaceFolders(index, null, { name: project.label, uri: vscode.Uri.file(project.path) });
		
	}
	
	public async createQuickPickItems () {
		
		if (this.initCache) {
			await this.detectWorkspaces();
			this.initCache = false;
		}
		
		const workspaceGroups = states.getWorkspaceGroups(this.context);
		const items:WorkspaceQuickPickItem[] = [];
		
		workspaceGroups.forEach((workspaceGroup) => {
			
			const paths = workspaceGroup.paths;
			const names = this.cache.filter((workspace) => paths.includes(workspace.path));
			
			items.push({
				label: workspaceGroup.label,
				description: names.map((favorite) => favorite.label).join(', '),
				paths: workspaceGroup.paths,
			});
			
		});
		
		this.cache.forEach((project) => {
			
			items.push({
				label: project.label,
				description: project.path,
				detail: project.deleted ? '$(alert) Path does not exist' : '',
				paths: null,
			});
			
		});
		
		return items;
		
	}
	
	public saveCollapseState (item:GroupTreeItem, state:boolean) {
		
		const sortWorkspacesBy = this.sortWorkspacesBy;
		
		if (sortWorkspacesBy === 'Name') return;
		
		let groupStates = GROUP_STATES_BY_TYPE;
		
		if (sortWorkspacesBy === 'Group') groupStates = GROUP_STATES_BY_GROUP;
		else if (sortWorkspacesBy === 'Simple') groupStates = GROUP_STATES_BY_SIMPLE;
		
		const groups:(GroupCustomState|GroupSimpleState|GroupTypeState)[] = this.context.globalState.get(groupStates, []);
		const groupType = item.group.type;
		
		if (!groups.some((group) => group.type === groupType ? (group.collapsed = state) || true : false)) {
			groups.push({ type: groupType, collapsed: state });
		}
		
		item.group.collapsed = state;
		
		this.context.globalState.update(groupStates, groups);
		
	}
	
}

//	Functions __________________________________________________________________

function createWorkspaceDetection (paths:string[], options:Options) {
	
	const promises:Promise<FileMap>[] = [];
	
	paths.forEach((path) => {
			
		if (fs.existsSync(path)) {
			promises.push(new Promise((resolve, reject) => {
				
				walktree(path, options, (error, result) => {
					
					if (error) reject(error);
					else resolve(result);
					
				});
				
			}));
		}
		
	});
	
	return promises;
	
}

function createSubfolderDetection (paths:string[], options:Options) {
	
	const promises:Promise<FileMap>[] = [];
	
	paths.forEach((path) => {
			
		if (fs.existsSync(path)) {
			promises.push(new Promise((resolve, reject) => {
				
				subfolders(path, options, (error, result) => {
					
					if (error) reject(error);
					else resolve(result);
					
				});
				
			}));
		}
		
	});
	
	return promises;
	
}