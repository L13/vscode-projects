//	Imports ____________________________________________________________________

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

import { sortCaseInsensitive } from '../@l13/arrays';
import { walktree } from '../@l13/fse';

import { File, Options } from '../@types/files';
import { GroupSimple, GroupSimpleState, GroupTreeItem, GroupType, GroupTypeState, InitialState, WorkspaceSortting } from '../@types/groups';
import { Project, TreeItems } from '../@types/projects';

import * as dialogs from '../common/dialogs';
import * as files from '../common/files';
import * as settings from '../common/settings';

import { HotkeySlots } from '../features/HotkeySlots';

import { CurrentProjectTreeItem } from './trees/CurrentProjectTreeItem';
import { GroupSimpleTreeItem } from './trees/GroupSimpleTreeItem';
import { GroupTypeTreeItem } from './trees/GroupTypeTreeItem';
import { ProjectTreeItem } from './trees/ProjectTreeItem';
import { UnknownProjectTreeItem } from './trees/UnknownProjectTreeItem';

//	Variables __________________________________________________________________

const findGitFolder:RegExp = /^\.git$/;
const findVSCodeFolder:RegExp = /^\.vscode$/;
const findExtWorkspace = /\.code-workspace$/;

const GROUP_STATES_BY_TYPE = 'groupStatesByType';
const GROUP_STATES_BY_SIMPLE = 'groupStatesBySimple';
const PROJECTS = 'projects';

let sortWorkspacesBy:WorkspaceSortting = settings.get('sortWorkspacesBy');

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class WorkspacesProvider implements vscode.TreeDataProvider<TreeItems> {
	
	private _onDidChangeTreeData:vscode.EventEmitter<TreeItems|undefined> = new vscode.EventEmitter<TreeItems|undefined>();
	public readonly onDidChangeTreeData:vscode.Event<TreeItems|undefined> = this._onDidChangeTreeData.event;
	
	private static _onDidChangeProject:vscode.EventEmitter<Project> = new vscode.EventEmitter<Project>();
	public static readonly onDidChangeProject:vscode.Event<Project> = WorkspacesProvider._onDidChangeProject.event;
	
	private disposables:vscode.Disposable[] = [];
	
	private isFirstView:boolean = true;
	private cache:Project[] = [];
	
	public projects:Project[] = [];
	public gitProjects:Project[] = [];
	public vscodeProjects:Project[] = [];
	public workspaceProjects:Project[] = [];
	
	public groupTypes:GroupType[] = [
		{ label: 'Projects', type: 'folder', collapsed: false },
		{ label: 'Project Workspaces', type: 'folders', collapsed: false },
		{ label: 'Git', type: 'git', collapsed: false },
		{ label: 'Visual Studio Code', type: 'vscode', collapsed: false },
		{ label: 'VS Code Workspaces', type: 'workspace', collapsed: false },
	];
	
	public groupSimples:GroupSimple[] = [
		{ label: 'Projects', type: 'project', projectTypes: ['folder', 'folders'], collapsed: false },
		{ label: 'Git', type: 'git', projectTypes: ['git'], collapsed: false },
		{ label: 'Visual Studio Code', type: 'vscode', projectTypes: ['vscode', 'workspace'], collapsed: false },
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
			this.isFirstView = false;
		}
		
		this.slots = HotkeySlots.create(this.context);
		
		vscode.workspace.onDidChangeConfiguration((event) => {
			
			if (event.affectsConfiguration('l13Projects.sortWorkspacesBy')) {
				sortWorkspacesBy = settings.get('sortWorkspacesBy');
				this.setContextGroups();
				this.refresh();
			}
			
		}, null, this.disposables);
		
		// this.context.globalState.update(GROUP_STATES_BY_SIMPLE, undefined);
		// this.context.globalState.update(GROUP_STATES_BY_TYPE, undefined);
		const groupTypeStates:GroupTypeState[] = this.context.globalState.get(GROUP_STATES_BY_TYPE, []);
		const groupSimpleStates:GroupSimpleState[] = this.context.globalState.get(GROUP_STATES_BY_SIMPLE, []);
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
		
		this.setContextGroups();
		
	}
	
	public dispose () {
		
		this.disposables.forEach((disposable) => disposable.dispose());
		
	}
	
	private setContextGroups () {
		
		vscode.commands.executeCommand('setContext', 'l13ProjectGroups', sortWorkspacesBy !== 'Name');
		
	}
	
	private detectProjects () {
		
		const gitFolders = settings.get('git.folders', []);
		const vscodeFolders = settings.get('vsCode.folders', []);
		const workspaceFolders = settings.get('workspace.folders', []);
		const promises:Promise<any>[] = [];
		
		return promises.concat(this.detectProjectsFor('cacheGitProjects', this.gitProjects = [], 'git', gitFolders, {
			find: findGitFolder,
			type: 'folder',
			maxDepth: settings.get('git.maxDepthRecursion', 1),
			ignore: settings.get('git.ignore', []),
		}), this.detectProjectsFor('cacheVSCodeProjects', this.vscodeProjects = [], 'vscode', vscodeFolders, {
			find: findVSCodeFolder,
			type: 'folder',
			maxDepth: settings.get('vsCode.maxDepthRecursion', 1),
			ignore: settings.get('vsCode.ignore', []),
		}), this.detectProjectsFor('cacheWorkspaceProjects', this.workspaceProjects = [], 'workspace', workspaceFolders, {
			find: findExtWorkspace,
			type: 'file',
			maxDepth: settings.get('workspace.maxDepthRecursion', 1),
			ignore: settings.get('workspace.ignore', []),
		}));
		
	}
	
	public refreshProjects () :void {
		
		this.detectProjects();
		
		this._onDidChangeTreeData.fire();
		
	}
	
	public refresh () :void {
		
		this.updateCache();
		
		this._onDidChangeTreeData.fire();
		
	}
	
	public getTreeItem (element:ProjectTreeItem) :vscode.TreeItem {
		
		return element;
		
	}
	
	private detectProjectsFor (cacheName: string, detectedProjects:Project[], type:'git'|'vscode'|'workspace', paths:string[], options:Options) {
		
		const promises:Promise<{ [relative:string]: File }>[] = [];
		
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
		
		if (promises.length) {
			return [Promise.all(promises).then((results) => {
				
				results.forEach((files) => {
					
					for (const file of Object.values(files)) {
						const pathname = file.type === 'file' ? file.path : path.dirname(file.path);
						detectedProjects.push({
							label: path.basename(pathname, '.code-workspace'),
							path: pathname,
							type,
						});
					}
					
					this.context.globalState.update(cacheName, detectedProjects);
					
				});
				
				detectedProjects.sort(({ label:a }:Project, { label:b }:Project) => sortCaseInsensitive(a, b));
				
				this.refresh();
				
			}, (error) => { vscode.window.showErrorMessage(error.message); })];
		}
		
		this.refresh();
		
		return [];
		
	}
	
	private updateCache () {
		
		this.projects = this.context.globalState.get(PROJECTS) || [];
		this.projects.forEach((project) => project.deleted = !fs.existsSync(project.path));
		
		const all = (<Project[]>[]).concat(this.projects, this.gitProjects, this.vscodeProjects, this.workspaceProjects);
		const once:{ [name:string]:Project } = {};
		
		all.forEach((project) => {
			
			if (once[project.path]) {
				const type = once[project.path].type;
				if (type === 'folder') return;
				if (project.type === 'folder') return once[project.path] = project;
				if (type === 'folders') return;
				if (project.type === 'folders') return once[project.path] = project;
				if (type === 'git') return;
				if (project.type === 'git') return once[project.path] = project;
				if (type === 'vscode') return;
				if (project.type === 'vscode') return once[project.path] = project;
			} else once[project.path] = project;
			
		});
		
		this.cache = Object.values(once).sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
		this.context.globalState.update('cache', this.cache);
		
	}
	
	private addSimpleGroups (list:TreeItems[], workspacePath:string) {
		
		this.groupSimples.forEach((group) => {
			
			if (this.cache.some((project) => group.projectTypes.includes(project.type)) || group.type === 'project' && this.isUnknownWorkspace(workspacePath)) {
				list.push(new GroupSimpleTreeItem(group));
			}
			
		});
		
	}
	
	private addSimpleGroupItems (list:TreeItems[], type:string, workspacePath:string) {
		
		const slots = this.slots;
		let hasCurrentProject = false;
		
		this.cache.forEach((project) => {
						
			let simpleType = null;
			
			switch (project.type) {
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
			}
		
			if (type === simpleType) {
				const slot = slots.get(project);
				if (workspacePath && workspacePath === project.path) {
					hasCurrentProject = true;
					list.push(new CurrentProjectTreeItem(project, slot));
				} else list.push(new ProjectTreeItem(project, slot));
			}
			
		});
		
		if ((type === 'project') && !hasCurrentProject && this.isUnknownWorkspace(workspacePath)) {
			this.addUnknownItem(list, workspacePath);
		}
		
	}
	
	private addTypeGroups (list:TreeItems[], workspacePath:string) {
		
		this.groupTypes.forEach((group) => {
			
			if (this.cache.some((project) => project.type === group.type
			|| group.type === 'folder' && this.isUnknownWorkspace(workspacePath) && !findExtWorkspace.test(workspacePath)
			|| group.type === 'folders' && this.isUnknownWorkspace(workspacePath) && findExtWorkspace.test(workspacePath))) {
				list.push(new GroupTypeTreeItem(group));
			}
			
		});
		
	}
	
	private addTypeGroupItems (list:TreeItems[], type:string, workspacePath:string) {
		
		const workspaceFile = vscode.workspace.workspaceFile;
		const slots = this.slots;
		let hasCurrentProject = false;
		
		this.cache.forEach((project) => {
					
			if (type === project.type) {
				const slot = slots.get(project);
				if (workspacePath && workspacePath === project.path) {
					hasCurrentProject = true;
					list.push(new CurrentProjectTreeItem(project, slot));
				} else list.push(new ProjectTreeItem(project, slot));
			}
			
		});
		
		if ((type === 'folder' && !workspaceFile || type === 'folders' && workspaceFile)
		&& !hasCurrentProject && this.isUnknownWorkspace(workspacePath)) {
			this.addUnknownItem(list, workspacePath);
		}
		
	}
	
	private addItems (list:TreeItems[], workspacePath:string) {
		
		const slots = this.slots;
		let hasCurrentProject = false;
		
		this.cache.forEach((project) => {
			
			const slot = slots.get(project);
			if (workspacePath && workspacePath === project.path) {
				hasCurrentProject = true;
				list.push(new CurrentProjectTreeItem(project, slot));
			} else list.push(new ProjectTreeItem(project, slot));
			
		});
		
		if (workspacePath && !hasCurrentProject) this.addUnknownItem(list, workspacePath);
		
	}
	
	private addUnknownItem (list:TreeItems[], workspacePath:string) {
		
		list.unshift(new UnknownProjectTreeItem({
			label: path.basename(workspacePath, '.code-workspace'),
			path: workspacePath,
			type: findExtWorkspace.test(workspacePath) ? 'folders' : 'folder',
		}));
		
	}
	
	public getChildren (element?:TreeItems) :Thenable<TreeItems[]> {
		
		if (this.isFirstView) {
			this.updateCache();
			this.detectProjects();
			this.isFirstView = false;
		}
		
		const workspacePath:string = settings.getWorkspacePath();
		const list:TreeItems[] = [];
		
		if (sortWorkspacesBy !== 'Name') {
			if (element) {
				const type = (<GroupTreeItem>element).group.type;
				if (sortWorkspacesBy === 'Simple') this.addSimpleGroupItems(list, type, workspacePath);
				else this.addTypeGroupItems(list, type, workspacePath);
			} else {
				if (sortWorkspacesBy === 'Simple') this.addSimpleGroups(list, workspacePath);
				else this.addTypeGroups(list, workspacePath);
			}
		} else this.addItems(list, workspacePath);
		
		return Promise.resolve(list);
		
	}
	
	private isUnknownWorkspace (workspacePath:string) {
		
		if (!workspacePath) return false;
		
		return !this.cache.some((project) => workspacePath === project.path);
		
	}
	
	public static isWorkspace (workspacePath:string) {
		
		return findExtWorkspace.test(workspacePath);
		
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
	
	public static async pickProject (context:vscode.ExtensionContext) {
		
		const projectProvider = WorkspacesProvider.createProvider(context);
		const items = projectProvider.isFirstView ? Promise.all(projectProvider.detectProjects()).then(() => {
			
			projectProvider.isFirstView = false;
			
			return projectProvider.createQuickPickItems();
			
		}) : projectProvider.createQuickPickItems();
		
		const value = await vscode.window.showQuickPick(items, { placeHolder: 'Select a project' })
		
		if (value) files.open(value.description);
		
	}
	
	public static async addProject (context:vscode.ExtensionContext) {
		
		const uris = await dialogs.open();
		
		if (!uris) return;
		
		const projects:Project[] = context.globalState.get(PROJECTS) || [];
		const length = projects.length;
		
		uris.filter((uri) => {
			
			const fsPath = uri.fsPath;
			const stat = fs.lstatSync(fsPath);
			
			if (stat.isDirectory() || stat.isFile() && findExtWorkspace.test(path.basename(fsPath))) return true;
			
			vscode.window.showErrorMessage(`'${fsPath}' is not a folder or a ".code-workspace" file!`);
			
			return false;
			
		}).forEach((uri) => {
			
			const fsPath = uri.fsPath;
			
			if (projects.some(({ path }) => path === fsPath)) return;
			
			saveProject(projects, fsPath, path.basename(fsPath, '.code-workspace'));
			
		});
		
		if (projects.length === length) return;
		
		context.globalState.update(PROJECTS, projects);
		
		WorkspacesProvider.currentProvider?.refresh();
		
	}
	
	public static async saveProject (context:vscode.ExtensionContext, project?:Project) {
		
		const fsPath:string = project ? project.path : settings.getWorkspacePath();
		
		if (fsPath) {
			const projects:Project[] = context.globalState.get(PROJECTS) || [];
			
			if (projects.some(({ path }) => path === fsPath)) {
				return vscode.window.showErrorMessage(`Project exists!`);
			}
			
			const value = await vscode.window.showInputBox({
				value: path.basename(fsPath, '.code-workspace'),
				placeHolder: 'Please enter a name for the project',
			});
			
			if (!value) return;
			
			const newProject:Project = saveProject(projects, fsPath, value);
			
			context.globalState.update(PROJECTS, projects);
			WorkspacesProvider._onDidChangeProject.fire(newProject);
			
			WorkspacesProvider.currentProvider?.refresh();
			
		} else if (vscode.workspace.workspaceFile && vscode.workspace.workspaceFile.scheme === 'untitled') {
			vscode.window.showWarningMessage(`Please save your current workspace first.`);
			vscode.commands.executeCommand('workbench.action.saveWorkspaceAs');
		} else vscode.window.showErrorMessage(`No folder or workspace available!`);
		
	}
	
	public static updateProject (context:vscode.ExtensionContext, project:Project) {
		
		const projects:Project[] = context.globalState.get(PROJECTS) || [];
		
		for (const pro of projects) {
			if (pro.path === project.path) {
				pro.label = project.label;
				projects.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
				context.globalState.update(PROJECTS, projects);
				WorkspacesProvider.currentProvider?.refresh();
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
		
		const value = await dialogs.confirm(`Delete project "${project.label}"?`, 'Delete');
		
		if (value) {
			
			const projects:Project[] = context.globalState.get(PROJECTS) || [];
			const fsPath = project.path;
			
			for (let i = 0; i < projects.length; i++) {
				if (projects[i].path === fsPath) {
					projects.splice(i, 1);
					context.globalState.update(PROJECTS, projects);
					const provider = WorkspacesProvider.createProvider(context);
					provider.refresh();
					for (const pro of provider.cache) {
						if (pro.path === fsPath) {
							WorkspacesProvider._onDidChangeProject.fire(pro);
							return;
						}
					}
					project.label = path.basename(fsPath, '.code-workspace');
					project.type = findExtWorkspace.test(fsPath) ? 'folders' : 'folder';
					WorkspacesProvider._onDidChangeProject.fire(project);
					return;
				}
			}
			
			vscode.window.showErrorMessage(`Project does not exist`);
		}
		
	}
	
	public static saveCollapseState (context:vscode.ExtensionContext, item:GroupTreeItem, state:boolean) {
		
		if (sortWorkspacesBy === 'Name') return;
		
		const GROUP_STATES = sortWorkspacesBy === 'Simple' ? GROUP_STATES_BY_SIMPLE : GROUP_STATES_BY_TYPE;
		const groups:(GroupSimpleState|GroupTypeState)[] = context.globalState.get(GROUP_STATES, []);
		const groupType = item.group.type;
		
		if (!groups.some((group) => group.type === groupType ? (group.collapsed = state) || true : false)) {
			groups.push({ type: groupType, collapsed: state });
		}
		
		item.group.collapsed = state;
		
		context.globalState.update(GROUP_STATES, groups);
		
	}
	
	public collapseAll () {
		
		if (sortWorkspacesBy === 'Name') return;
		
		const GROUP_STATES = sortWorkspacesBy === 'Simple' ? GROUP_STATES_BY_SIMPLE : GROUP_STATES_BY_TYPE;
		const groups:(GroupSimple|GroupType)[] = sortWorkspacesBy === 'Simple' ? this.groupSimples : this.groupTypes;
		const groupTreeItem = sortWorkspacesBy === 'Simple' ? GroupSimpleTreeItem : GroupTypeTreeItem;
		const groupStates:(GroupSimpleState|GroupTypeState)[] = this.context.globalState.get(GROUP_STATES, []);
		
		groupTreeItem.updateStateVersion();
		
		groups.forEach((group) => {
			
			const type = group.type;
			
			group.collapsed = true;
			
			if (!groupStates.some((groupState) => groupState.type === type ? groupState.collapsed = true : false)) {
				groupStates.push({ type, collapsed: true });
			}
			
		});
		
		this.context.globalState.update(GROUP_STATES, groupStates);
		
		this.refresh();
		
	}
	
	public static async clearProjects (context:vscode.ExtensionContext) {
		
		const value = await dialogs.confirm(`Delete all projects?'`, 'Delete');
	
		if (value) {
			context.globalState.update(PROJECTS, []);
			WorkspacesProvider.createProvider(context).refresh();
		}
		
	}
	
}

//	Functions __________________________________________________________________

function saveProject (projects:Project[], fsPath:string, value:string) :Project {
	
	const project:Project = {
		label: value,
		path: fsPath,
		type: findExtWorkspace.test(fsPath) ? 'folders' : 'folder',
	};
	
	projects.push(project);
	
	projects.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
	
	return project;
	
}