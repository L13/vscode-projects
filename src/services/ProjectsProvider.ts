//	Imports ____________________________________________________________________

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

import { File, Options } from '../types';
import { Project, TreeItems } from '../types';
import { walktree } from './@l13/fse';
import { getWorkspacePath, sortCaseInsensitive } from './common';
import { CurrentProjectTreeItem } from './trees/CurrentProjectTreeItem';
import { ProjectTreeItem } from './trees/ProjectTreeItem';
import { UnknownProjectTreeItem } from './trees/UnknownProjectTreeItem';

//	Variables __________________________________________________________________

const findGitFolder:RegExp = /^\.git$/;
const findVSCodeFolder:RegExp = /^\.vscode$/;

export const findExtWorkspace = /\.code-workspace$/;

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class ProjectsProvider implements vscode.TreeDataProvider<TreeItems> {
	
	private _onDidChangeTreeData:vscode.EventEmitter<TreeItems|undefined> = new vscode.EventEmitter<TreeItems|undefined>();
	public readonly onDidChangeTreeData:vscode.Event<TreeItems|undefined> = this._onDidChangeTreeData.event;
	
	private static _onDidChangeProject:vscode.EventEmitter<Project> = new vscode.EventEmitter<Project>();
	public static readonly onDidChangeProject:vscode.Event<Project> = ProjectsProvider._onDidChangeProject.event;
	
	private isFirstView:boolean = true;
	private cache:Project[] = [];
	public projects:Project[] = [];
	public gitProjects:Project[] = [];
	public vscodeProjects:Project[] = [];
	public workspaceProjects:Project[] = [];
	
	public static currentProvider:ProjectsProvider|undefined;
	
	public static createProvider (context:vscode.ExtensionContext) {
		
		return ProjectsProvider.currentProvider || (ProjectsProvider.currentProvider = new ProjectsProvider(context));
		
	}
	
	private constructor (private context:vscode.ExtensionContext) {
		
		if (vscode.workspace.getConfiguration('l13Projects').get('useCacheForDetectedProjects')) {
			this.cache = context.globalState.get('cache') || [];
			this.gitProjects = context.globalState.get('cacheGitProjects') || [];
			this.vscodeProjects = context.globalState.get('cacheVSCodeProjects') || [];
			this.workspaceProjects = context.globalState.get('cacheWorkspaceProjects') || [];
			this.isFirstView = false;
		}
		
	}
	
	private detectProjects () {
		
		const config = vscode.workspace.getConfiguration('l13Projects');
		const gitFolders = config.get('git.folders', []);
		const vscodeFolders = config.get('vsCode.folders', []);
		const workspaceFolders = config.get('workspace.folders', []);
		const promises:Promise<any>[] = [];
		
		return promises.concat(this.detectProjectsFor('cacheGitProjects', this.gitProjects = [], 'git', gitFolders, {
			find: findGitFolder,
			type: 'folder',
			maxDepth: config.get('git.maxDepthRecursion', 1),
			ignore: config.get('git.ignore', []),
		}), this.detectProjectsFor('cacheVSCodeProjects', this.vscodeProjects = [], 'vscode', vscodeFolders, {
			find: findVSCodeFolder,
			type: 'folder',
			maxDepth: config.get('vsCode.maxDepthRecursion', 1),
			ignore: config.get('vsCode.ignore', []),
		}), this.detectProjectsFor('cacheWorkspaceProjects', this.workspaceProjects = [], 'workspace', workspaceFolders, {
			find: findExtWorkspace,
			type: 'file',
			maxDepth: config.get('workspace.maxDepthRecursion', 1),
			ignore: config.get('workspace.ignore', []),
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
		
		this.projects = this.context.globalState.get('projects') || [];
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
	
	public getChildren (element?:TreeItems) :Thenable<TreeItems[]> {
		
		if (this.isFirstView) {
			this.updateCache();
			this.detectProjects();
			this.isFirstView = false;
		}
		
		let hasCurrentProject = false;
		const workspacePath:string = getWorkspacePath();
		const list = this.cache.map((project) => {
			
			if (workspacePath && workspacePath === project.path) {
				hasCurrentProject = true;
				return new CurrentProjectTreeItem(project);
			}
			
			return new ProjectTreeItem(project);
			
		});
		
		if (workspacePath && !hasCurrentProject) {
			list.unshift(new UnknownProjectTreeItem({
				label: path.basename(workspacePath, '.code-workspace'),
				path: workspacePath,
				type: findExtWorkspace.test(workspacePath) ? 'folders' : 'folder',
			}));
		}
		
		return Promise.resolve(list);
		
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
	
	public static pickProject (context:vscode.ExtensionContext) {
		
		const projectProvider = ProjectsProvider.createProvider(context);
		const items = projectProvider.isFirstView ? Promise.all(projectProvider.detectProjects()).then(() => {
			
			projectProvider.isFirstView = false;
			
			return projectProvider.createQuickPickItems();
			
		}) : projectProvider.createQuickPickItems();
		
		vscode.window.showQuickPick(items, { placeHolder: 'Select a project' }).then((value:any) => {
			
			if (!value) return;
			
			const newWindow = vscode.workspace.getConfiguration('l13Projects').get('openInNewWindow', false);
			
			vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(value.description), newWindow);
			
		});
		
	}
	
	public static addProject (context:vscode.ExtensionContext) {
		
		vscode.window.showOpenDialog({
			canSelectFiles: true,
			canSelectFolders: true,
			canSelectMany: true,
		}).then((uris) => {
			
			if (!uris) return;
			
			const projects:Project[] = context.globalState.get('projects') || [];
			const length = projects.length;
			
			uris.filter((uri) => {
				
				const fsPath = uri.fsPath;
				const stat = fs.lstatSync(fsPath);
				
				if (stat.isDirectory() || stat.isFile() && findExtWorkspace.test(path.basename(fsPath))) return true;
				
				vscode.window.showErrorMessage(`'${fsPath}' is not a folder or a *.code-workspace file!`);
				
				return false;
				
			}).forEach((uri) => {
				
				const fsPath = uri.fsPath;
				
				if (projects.some(({ path }) => path === fsPath)) {
					return vscode.window.showErrorMessage(`Project '${fsPath}' exists!`);
				}
				
				saveProject(projects, fsPath, path.basename(fsPath, '.code-workspace'));
				
			});
			
			const total = projects.length - length;
			
			if (!total) return;
			
			context.globalState.update('projects', projects);
			
			if (ProjectsProvider.currentProvider) ProjectsProvider.currentProvider.refresh();
			
			vscode.window.showInformationMessage(`${total} project${total === 1 ? '' : 's'} added!`);
			
		});
		
	}
	
	public static saveProject (context:vscode.ExtensionContext, project?:Project) {
		
		const fsPath:string = project ? project.path : getWorkspacePath();
		
		if (fsPath) {
			const projects:Project[] = context.globalState.get('projects') || [];
			
			if (projects.some(({ path }) => path === fsPath)) {
				return vscode.window.showErrorMessage(`Project exists!`);
			}
			
			vscode.window.showInputBox({ value: path.basename(fsPath, '.code-workspace') }).then((value) => {
				
				if (!value) return;
				
				const newProject:Project = saveProject(projects, fsPath, value);
				context.globalState.update('projects', projects);
				ProjectsProvider._onDidChangeProject.fire(newProject);
				
				if (ProjectsProvider.currentProvider) ProjectsProvider.currentProvider.refresh();
				
				vscode.window.showInformationMessage(`Project '${value}' saved!`);
				
			});
			
		} else if (vscode.workspace.workspaceFile && vscode.workspace.workspaceFile.scheme === 'untitled') {
			vscode.window.showWarningMessage(`Please save your current workspace first.`);
			vscode.commands.executeCommand('workbench.action.saveWorkspaceAs');
		} else vscode.window.showErrorMessage(`No folder or workspace available!`);
		
	}
	
	public static updateProject (context:vscode.ExtensionContext, project:Project) {
		
		const projects:Project[] = context.globalState.get('projects') || [];
		
		for (const pro of projects) {
			if (pro.path === project.path) {
				pro.label = project.label;
				projects.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
				context.globalState.update('projects', projects);
				if (ProjectsProvider.currentProvider) ProjectsProvider.currentProvider.refresh();
				break;
			}
		}
		
	}
	
	public static renameProject (context:vscode.ExtensionContext, project:Project) {
		
		vscode.window.showInputBox({ value: project.label }).then((value) => {
			
			if (project.label === value || value === undefined) return;
			
			if (!value) {
				vscode.window.showErrorMessage(`Project with no name is not valid!`);
				return;
			}
			
			project.label = value;
			ProjectsProvider.updateProject(context, project);
			ProjectsProvider._onDidChangeProject.fire(project);
			vscode.window.showInformationMessage(`Saved "${value}" in projects!`);
			
		});
		
	}
	
	public static removeProject (context:vscode.ExtensionContext, project:Project) {
		
		vscode.window.showInformationMessage(`Delete project "${project.label}"?`, { modal: true }, 'Delete').then((value) => {
			
			if (value) {
				
				const projects:Project[] = context.globalState.get('projects') || [];
				const fsPath = project.path;
				
				for (let i = 0; i < projects.length; i++) {
					if (projects[i].path === fsPath) {
						projects.splice(i, 1);
						context.globalState.update('projects', projects);
						const provider = ProjectsProvider.createProvider(context);
						provider.refresh();
						for (const pro of provider.cache) {
							if (pro.path === fsPath) {
								ProjectsProvider._onDidChangeProject.fire(pro);
								return;
							}
						}
						project.label = path.basename(fsPath, '.code-workspace');
						project.type = findExtWorkspace.test(fsPath) ? 'folders' : 'folder';
						ProjectsProvider._onDidChangeProject.fire(project);
						return;
					}
				}
				
				vscode.window.showErrorMessage(`Project does not exist`);
			}
			
		});
		
	}
	
	public static clearProjects (context:vscode.ExtensionContext) {
		
		vscode.window.showInformationMessage(`Delete all projects?'`, { modal: true }, 'Delete').then((value) => {
			
			if (value) {
				context.globalState.update('projects', []);
				ProjectsProvider.createProvider(context).refresh();
			}
			
		});
		
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