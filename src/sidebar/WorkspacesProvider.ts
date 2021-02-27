//	Imports ____________________________________________________________________

import * as fs from 'fs';
import * as vscode from 'vscode';

import { remove, sortCaseInsensitive } from '../@l13/arrays';
import { formatLabel } from '../@l13/formats';
import { subfolders, walktree } from '../@l13/fse';
import { isMacOs } from '../@l13/platforms';

import { FileMap, Options } from '../@types/files';
import { GroupCustomState, GroupSimple, GroupSimpleState, GroupTreeItem, GroupType, GroupTypeState, InitialState, WorkspaceSorting } from '../@types/groups';
import { Project, WorkspaceGroup, WorkspacesTreeItems, WorkspaceTypes } from '../@types/workspaces';

import * as dialogs from '../common/dialogs';
import * as files from '../common/files';
import * as settings from '../common/settings';

import { HotkeySlots } from '../features/HotkeySlots';
import { colors } from '../statusbar/colors';

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

const PROJECTS = 'projects';
const WORKSPACE_GROUPS = 'workspaceGroups';

let sortWorkspacesBy:WorkspaceSorting = settings.get('sortWorkspacesBy');

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class WorkspacesProvider implements vscode.TreeDataProvider<WorkspacesTreeItems> {
	
	private _onDidChangeTreeData:vscode.EventEmitter<WorkspacesTreeItems|undefined> = new vscode.EventEmitter<WorkspacesTreeItems|undefined>();
	public readonly onDidChangeTreeData:vscode.Event<WorkspacesTreeItems|undefined> = this._onDidChangeTreeData.event;
	
	private static _onDidChangeProject:vscode.EventEmitter<Project> = new vscode.EventEmitter<Project>();
	public static readonly onDidChangeProject:vscode.Event<Project> = WorkspacesProvider._onDidChangeProject.event;
	
	public static colorPicker = new ColorPickerTreeItem();
	
	private disposables:vscode.Disposable[] = [];
	
	private initCache:boolean = true;
	private cache:Project[] = [];
	
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
	
	public static createProvider (context:vscode.ExtensionContext) {
		
		return WorkspacesProvider.currentProvider || (WorkspacesProvider.currentProvider = new WorkspacesProvider(context));
		
	}
	
	private constructor (private context:vscode.ExtensionContext) {
		
		if (settings.get('useCacheForDetectedProjects')) {
			this.cache = context.globalState.get('cache') || [];
			this.gitProjects = context.globalState.get('cacheGitProjects') || [];
			this.vscodeProjects = context.globalState.get('cacheVSCodeProjects') || [];
			this.workspaceProjects = context.globalState.get('cacheWorkspaceProjects') || [];
			this.subfolderProjects = context.globalState.get('cacheSubfolderProjects') || [];
			this.initCache = false;
		}
		
		this.slots = HotkeySlots.create(this.context);
		
		vscode.workspace.onDidChangeConfiguration((event) => {
			
			if (event.affectsConfiguration('l13Projects.sortWorkspacesBy')) {
				sortWorkspacesBy = settings.get('sortWorkspacesBy');
				this.refresh();
			}
			
		}, null, this.disposables);
		
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
		
		WorkspacesProvider.colorPicker.project = project;
		
		this.refresh();
		
	}
	
	public hideColorPicker () {
		
		WorkspacesProvider.colorPicker.project = null;
		
		this.refresh();
		
	}
	
	public assignColor (project:Project, color:number) {
		
		if (color) project.color = color;
		else delete project.color;
		
		WorkspacesProvider.colorPicker.project = null;
		WorkspacesProvider.updateProject(this.context, project);
		WorkspacesProvider._onDidChangeProject.fire(project);
		
		settings.updateStatusBarColorSettings(project.path, colors[color]);
		
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
		
		this.detectProjectColors();
		this.detectWorkspaces();
		
	}
	
	public refresh () {
		
		this.updateCache();
		
		this._onDidChangeTreeData.fire();
		
	}
	
	private cleanupUnknownPaths () {
		
		const workspaceGroups = getWorkspaceGroups(this.context);
		const paths = this.cache.map((workspace) => workspace.path);
		
		workspaceGroups.forEach((workspaceGroup) => {
			
			workspaceGroup.paths = workspaceGroup.paths.filter((path) => paths.includes(path));
			
		});
		
		updateWorkspaceGroups(this.context, workspaceGroups, true);
		
	}
	
	private detectProjectColors () {
		
		const projects = getProjects(this.context);
		
		projects.forEach((project) => {
			
			const statusBarColors = settings.getStatusBarColorSettings(project.path);
			
			if (statusBarColors) {
				colors:for (let i = 1; i < colors.length; i++) {
					const color:any = colors[i];
					for (const name in color) {
						if (color[name] !== statusBarColors[name]) continue colors;
					}
					project.color = i;
					WorkspacesProvider._onDidChangeProject.fire(project);
					break colors;
				}
			}
			
		});
		
		updateProjects(this.context, projects, true);
		
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
		
		this.projects = getProjects(this.context);
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
		
		const workspaceGroups = getWorkspaceGroups(this.context);
		let paths:string[] = [];
		
		workspaceGroups.forEach((workspaceGroup) => {
			
			paths = paths.concat(workspaceGroup.paths);
			list.push(new GroupCustomTreeItem(workspaceGroup));
			
		});
		
		const colorPickerProject = WorkspacesProvider.colorPicker.project;
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
				list.push(WorkspacesProvider.colorPicker);
			}
			
		});
		
		if (workspacePath && !hasCurrentWorkspace) this.addUnknownItem(list, workspacePath);
		
	}
	
	private addCustomGroupItems (list:WorkspacesTreeItems[], paths:string[], workspacePath:string) {
		
		const colorPickerProject = WorkspacesProvider.colorPicker.project;
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
				list.push(WorkspacesProvider.colorPicker);
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
		
		const colorPickerProject = WorkspacesProvider.colorPicker.project;
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
					list.push(WorkspacesProvider.colorPicker);
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
		
		const colorPickerProject = WorkspacesProvider.colorPicker.project;
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
					list.push(WorkspacesProvider.colorPicker);
				}
			}
			
		});
		
		if ((type === 'folder' && !workspaceFile || type === 'folders' && workspaceFile)
		&& !hasCurrentWorkspace && this.isUnknownWorkspace(workspacePath)) {
			this.addUnknownItem(list, workspacePath);
		}
		
	}
	
	private addItems (list:WorkspacesTreeItems[], workspacePath:string) {
		
		const colorPickerProject = WorkspacesProvider.colorPicker.project;
		const slots = this.slots;
		let hasCurrentWorkspace = false;
		
		this.cache.forEach((workspace) => {
			
			const slot = slots.get(workspace);
			
			if (!hasCurrentWorkspace && workspacePath && workspacePath === workspace.path) {
				hasCurrentWorkspace = true;
				list.push(new CurrentProjectTreeItem(workspace, slot));
			} else list.push(new ProjectTreeItem(workspace, slot));
			
			if (colorPickerProject?.path === workspace.path) {
				list.push(WorkspacesProvider.colorPicker);
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
	
	public getChildren (element?:WorkspacesTreeItems) :Thenable<WorkspacesTreeItems[]> {
		
		if (this.initCache) {
			this.updateCache();
			this.detectProjectColors();
			this.detectWorkspaces();
			this.initCache = false;
		}
		
		const workspacePath:string = settings.getCurrentWorkspacePath();
		const list:WorkspacesTreeItems[] = [];
		
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
	
	private getWorkspace (fsPath:string) {
		
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
	
	private createQuickPickItems () {
		
		return this.cache.map((project) => ({
			label: project.label,
			description: project.path,
			detail: project.deleted ? '$(alert) Path does not exist' : '',
		}));
		
	}
	
	public static async pickWorkspace (context:vscode.ExtensionContext) {
		
		const projectProvider = WorkspacesProvider.createProvider(context);
		
		if (projectProvider.initCache) {
			await projectProvider.detectWorkspaces();
			projectProvider.initCache = false;
		}
		
		const value = await vscode.window.showQuickPick(projectProvider.createQuickPickItems(), {
			placeHolder: 'Select a project',
		})
		
		if (value) files.open(value.description);
		
	}
	
	public static async addProject (context:vscode.ExtensionContext) {
		
		const uris = isMacOs ? await dialogs.open() : await dialogs.openFolder();
		
		if (!uris) return;
		
		const projects = getProjects(context);
		const length = projects.length;
		
		uris.forEach((uri) => {
			
			const fsPath = uri.fsPath;
			
			if (projects.some(({ path }) => path === fsPath)) return;
			
			addProject(projects, fsPath, formatLabel(fsPath));
			
		});
		
		if (projects.length === length) return;
		
		updateProjects(context, projects);
		
		WorkspacesProvider.currentProvider?.refresh();
		
	}
	
	public static async addProjectWorkspace (context:vscode.ExtensionContext) {
		
		const uris = await dialogs.openFile();
		
		if (!uris) return;
		
		const projects = getProjects(context);
		const length = projects.length;
		
		uris.forEach((uri) => {
			
			const fsPath = uri.fsPath;
			
			if (projects.some(({ path }) => path === fsPath)) return;
			
			addProject(projects, fsPath, formatLabel(fsPath));
			
		});
		
		if (projects.length === length) return;
		
		updateProjects(context, projects, true);
		
	}
	
	public static async saveProject (context:vscode.ExtensionContext, project?:Project) {
		
		const fsPath:string = project ? project.path : settings.getCurrentWorkspacePath();
		
		if (fsPath) {
			const projects = getProjects(context);
			
			if (projects.some(({ path }) => path === fsPath)) {
				return vscode.window.showErrorMessage(`Project exists!`);
			}
			
			const value = await vscode.window.showInputBox({
				value: formatLabel(fsPath),
				placeHolder: 'Please enter a name for the project',
			});
			
			if (!value) return;
			
			const newProject:Project = addProject(projects, fsPath, value);
			
			WorkspacesProvider._onDidChangeProject.fire(newProject);
			updateProjects(context, projects, true);
			
		} else if (vscode.workspace.workspaceFile && vscode.workspace.workspaceFile.scheme === 'untitled') {
			vscode.window.showWarningMessage(`Please save your current workspace first.`);
			vscode.commands.executeCommand('workbench.action.saveWorkspaceAs');
		} else vscode.window.showErrorMessage(`No folder or workspace available!`);
		
	}
	
	public static updateProject (context:vscode.ExtensionContext, project:Project) {
		
		const projects = getProjects(context);
		
		for (const pro of projects) {
			if (pro.path === project.path) {
				pro.label = project.label;
				pro.color = project.color;
				projects.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
				updateProjects(context, projects, true);
				break;
			}
		}
		
	}
	
	public static async renameProject (context:vscode.ExtensionContext, project:Project) {
		
		const value = await vscode.window.showInputBox({
			value: project.label,
			placeHolder: 'Please enter a new name for the project',
		});
		
		if (project.label === value || value === undefined) return;
		
		if (!value) {
			vscode.window.showErrorMessage(`Project with no name is not valid!`);
			return;
		}
		
		project.label = value;
		WorkspacesProvider.updateProject(context, project);
		WorkspacesProvider._onDidChangeProject.fire(project);
		
	}
	
	public static async removeProject (context:vscode.ExtensionContext, project:Project) {
		
		if (await dialogs.confirm(`Delete project "${project.label}"?`, 'Delete')) {
			
			const projects = getProjects(context);
			const fsPath = project.path;
			
			for (let i = 0; i < projects.length; i++) {
				if (projects[i].path === fsPath) {
					projects.splice(i, 1);
					updateProjects(context, projects);
					if (project.color) settings.updateStatusBarColorSettings(project.path, colors[0]);
					const provider = WorkspacesProvider.currentProvider;
					provider.refresh();
					project.removed = true;
					project = provider.getWorkspace(fsPath) || project;
					WorkspacesProvider._onDidChangeProject.fire(project);
					return;
				}
			}
			
			vscode.window.showErrorMessage(`Project does not exist`);
		}
		
	}
	
	public static async addWorkspaceGroup (context:vscode.ExtensionContext) {
		
		const label = await vscode.window.showInputBox({
			placeHolder: 'Please enter a name for the group.',
		});
		
		if (!label) return;
		
		const workspaceGroups = getWorkspaceGroups(context);
		
		for (const workspaceGroup of workspaceGroups) {
			if (workspaceGroup.label === label) {
				return vscode.window.showErrorMessage(`Workspace group "${label}" exists!`);
			}
		}
		
		workspaceGroups.push({ label, id: getNextGroupId(workspaceGroups), collapsed: false, paths: [], type: 'custom' });
		workspaceGroups.sort(({ label:a }, { label:b }) => sortCaseInsensitive(a, b));
		updateWorkspaceGroups(context, workspaceGroups, true);
		
	}
	
	public static async addWorkspaceToGroup (context:vscode.ExtensionContext, workspace:Project) {
		
		const workspaceGroups = getWorkspaceGroups(context);
		
		if (!workspaceGroups.length) await WorkspacesProvider.addWorkspaceGroup(context);
		
		const workspaceGroup = workspaceGroups.length > 1 ? await vscode.window.showQuickPick(workspaceGroups) : workspaceGroups[0];
		
		if (workspaceGroup && !workspaceGroup.paths.includes(workspace.path)) {
			workspaceGroups.some((group) => remove(group.paths, workspace.path));
			workspaceGroup.paths.push(workspace.path);
			workspaceGroup.paths.sort();
			updateWorkspaceGroups(context, workspaceGroups, true);
		}
		
	}
	
	public static removeFromWorkspaceGroup (context:vscode.ExtensionContext, workspace:Project) {
		
		const workspaceGroups = getWorkspaceGroups(context);
		
		workspaceGroups.some((workspaceGroup) => remove(workspaceGroup.paths, workspace.path));
		
		updateWorkspaceGroups(context, workspaceGroups, true);
		
	}
	
	public static async renameWorkspaceGroup (context:vscode.ExtensionContext, workspaceGroup:WorkspaceGroup) {
		
		const value = await vscode.window.showInputBox({
			placeHolder: 'Please enter a new name for the group.',
			value: workspaceGroup.label,
		});
		
		if (!value || workspaceGroup.label === value) return;
		
		const workspaceGroups = getWorkspaceGroups(context);
		const groupId = workspaceGroup.id;
		
		for (const group of workspaceGroups) {
			if (group.id === groupId) {
				group.label = value;
				workspaceGroups.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
				updateWorkspaceGroups(context, workspaceGroups, true);
				break;
			}
		}
		
	}
	
	public static async removeWorkspaceGroup (context:vscode.ExtensionContext, workspaceGroup:WorkspaceGroup) {
		
		const value = await dialogs.confirm(`Delete workspace group "${workspaceGroup.label}"?`, 'Delete');
		
		if (value) {
			const workspaceGroups = getWorkspaceGroups(context);
			const groupId = workspaceGroup.id;
			
			for (let i = 0; i < workspaceGroups.length; i++) {
				if (workspaceGroups[i].id === groupId) {
					workspaceGroups.splice(i, 1);
					updateWorkspaceGroups(context, workspaceGroups, true);
					break;
				}
			}
		}
		
	}
	
	public static saveCollapseState (context:vscode.ExtensionContext, item:GroupTreeItem, state:boolean) {
		
		if (sortWorkspacesBy === 'Name') return;
		
		let groupStates = GROUP_STATES_BY_TYPE;
		
		if (sortWorkspacesBy === 'Group') groupStates = GROUP_STATES_BY_GROUP;
		else if (sortWorkspacesBy === 'Simple') groupStates = GROUP_STATES_BY_SIMPLE;
		
		const groups:(GroupCustomState|GroupSimpleState|GroupTypeState)[] = context.globalState.get(groupStates, []);
		const groupType = item.group.type;
		
		if (!groups.some((group) => group.type === groupType ? (group.collapsed = state) || true : false)) {
			groups.push({ type: groupType, collapsed: state });
		}
		
		item.group.collapsed = state;
		
		context.globalState.update(groupStates, groups);
		
	}
	
	public static async clearProjects (context:vscode.ExtensionContext) {
		
		if (await dialogs.confirm(`Delete all projects?'`, 'Delete')) {
			updateProjects(context, [], true);
		}
		
	}
	
	public static async clearWorkspaceGroups (context:vscode.ExtensionContext) {
		
		if (await dialogs.confirm(`Delete all workspace groups?'`, 'Delete')) {
			updateWorkspaceGroups(context, [], true);
		}
		
	}
	
}

//	Functions __________________________________________________________________

function addProject (projects:Project[], fsPath:string, value:string) :Project {
	
	const project:Project = {
		label: value,
		path: fsPath,
		type: settings.isCodeWorkspace(fsPath) ? 'folders' : 'folder',
	};
	
	projects.push(project);
	
	projects.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
	
	return project;
	
}

function getProjects (context:vscode.ExtensionContext) :Project[] {
	
	return context.globalState.get(PROJECTS, []);
	
}

function updateProjects (context:vscode.ExtensionContext, projects:Project[], refresh:boolean = false) {
	
	context.globalState.update(PROJECTS, projects);
	
	if (refresh) WorkspacesProvider.currentProvider?.refresh();
	
}

function getWorkspaceGroups (context:vscode.ExtensionContext) :WorkspaceGroup[] {
	
	return context.globalState.get(WORKSPACE_GROUPS, []);
	
}

function updateWorkspaceGroups (context:vscode.ExtensionContext, workspaceGroups:WorkspaceGroup[], refresh?:boolean) {
	
	context.globalState.update(WORKSPACE_GROUPS, workspaceGroups);
	
	if (refresh) WorkspacesProvider.currentProvider?.refresh();
	
}

function getNextGroupId (workspaceGroups:WorkspaceGroup[]) :number {
	
	if (!workspaceGroups.length) return 0;
	
	const groupIds = workspaceGroups.map((favoriteGroup) => favoriteGroup.id);
	const maxGroupId = Math.max.apply(null, groupIds);
	let i = 0;
	
	while (i <= maxGroupId) {
		if (!groupIds.includes(i)) return i;
		i++;
	}
	
	return i;
	
}

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