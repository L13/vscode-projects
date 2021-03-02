//	Imports ____________________________________________________________________

import * as fs from 'fs';
import * as vscode from 'vscode';

import { sortCaseInsensitive } from '../@l13/arrays';
import { formatLabel } from '../@l13/formats';
import { subfolders, walktree } from '../@l13/fse';

import { FileMap, Options } from '../@types/files';
import { Project, UpdateCacheCallback, WorkspaceQuickPickItem, WorkspaceTypes } from '../@types/workspaces';

import * as files from '../common/files';
import * as settings from '../common/settings';
import * as states from '../common/states';

//	Variables __________________________________________________________________

const findGitFolder:RegExp = /^\.git$/;
const findVSCodeFolder:RegExp = /^\.vscode$/;

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class WorkspacesState {
	
	private static currentWorkspacesState:WorkspacesState = null;
	
	public static createWorkspacesState (context:vscode.ExtensionContext) {
		
		return WorkspacesState.currentWorkspacesState || (WorkspacesState.currentWorkspacesState = new WorkspacesState(context));
		
	}
	
	// private _onDidUpdateCache:vscode.EventEmitter<Project[]> = new vscode.EventEmitter<Project[]>();
	// public readonly onDidUpdateCache:vscode.Event<Project[]> = this._onDidUpdateCache.event;
	
	// private _onDidDeleteCache:vscode.EventEmitter<Project[]> = new vscode.EventEmitter<Project[]>();
	// public readonly onDidDeleteCache:vscode.Event<Project[]> = this._onDidDeleteCache.event;
	
	private _onDidChangeCache:vscode.EventEmitter<undefined> = new vscode.EventEmitter<undefined>();
	public readonly onDidChangeCache:vscode.Event<undefined> = this._onDidChangeCache.event;
	
	private projects:Project[] = [];
	
	private cache:Project[] = [];
	private gitCache:Project[] = [];
	private vscodeCache:Project[] = [];
	private workspaceCache:Project[] = [];
	private subfolderCache:Project[] = [];
	
	public constructor (private readonly context:vscode.ExtensionContext) {
		
		this.cache = states.getWorkspacesCache(context);
		this.gitCache = states.getGitCache(context);
		this.vscodeCache = states.getVSCodeCache(context);
		this.workspaceCache = states.getVSCodeWorkspaceCache(context);
		this.subfolderCache = states.getSubfolderCache(context);
		
	}
	
	public getWorkspacesCache () {
		
		return states.getWorkspacesCache(this.context);
		
	}
	
	// public updateWorkspacesCache (cache:Project[]) {
		
	// 	return states.updateWorkspacesCache(this.context, cache);
		
	// }
	
	public getWorkspaceByPath (fsPath:string) {
		
		for (const workspace of this.cache) {
			if (workspace.path === fsPath) return workspace;
		}
		
		return null;
		
	}
	
	public async pickWorkspace () {
		
		const items = await this.createQuickPickItems();
		
		const item = await vscode.window.showQuickPick(items, {
			placeHolder: 'Select a project',
		})
		
		if (item) {
			if (item.paths) files.openAll(item.paths);
			else files.open(item.description);
		}
		
	}
	
	private async createQuickPickItems () {
		
		if (!settings.get('useCacheForDetectedProjects', false)) {
			await this.detectWorkspaces();
		}
		
		const items:WorkspaceQuickPickItem[] = [];
		const workspaceGroups = states.getWorkspaceGroups(this.context);
		
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
	
	private cleanupUnknownPaths () {
		
		const workspaceGroups = states.getWorkspaceGroups(this.context);
		const paths = this.cache.map((workspace) => workspace.path);
		
		workspaceGroups.forEach((workspaceGroup) => {
			
			workspaceGroup.paths = workspaceGroup.paths.filter((path) => paths.includes(path));
			
		});
		
		states.updateWorkspaceGroups(this.context, workspaceGroups);
		
	}
	
	public refreshWorkspacesCache () {
		
		this.projects = states.getProjects(this.context);
		this.projects.forEach((project) => project.deleted = !fs.existsSync(project.path));
		
		const all = (<Project[]>[]).concat(
			this.projects,
			this.gitCache,
			this.vscodeCache,
			this.workspaceCache,
			this.subfolderCache,
		);
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
		
		states.updateWorkspacesCache(this.context, this.cache);
		
	}
	
	public detectWorkspaces () {
		
		const gitFolders = settings.get('git.folders', []);
		const vscodeFolders = settings.get('vsCode.folders', []);
		const workspaceFolders = settings.get('workspace.folders', []);
		const subfolderFolders = settings.get('subfolder.folders', []);
		const promises:Promise<any>[] = [];
		
		return Promise.all(promises.concat(this.detectWorkspacesFor(states.updateGitCache, this.gitCache = [], 'git', gitFolders, {
			find: findGitFolder,
			type: 'folder',
			maxDepth: settings.get('git.maxDepthRecursion', 1),
			ignore: settings.get('git.ignore', []),
		}), this.detectWorkspacesFor(states.updateVSCodeCache, this.vscodeCache = [], 'vscode', vscodeFolders, {
			find: findVSCodeFolder,
			type: 'folder',
			maxDepth: settings.get('vsCode.maxDepthRecursion', 1),
			ignore: settings.get('vsCode.ignore', []),
		}), this.detectWorkspacesFor(states.updateVSCodeWorkspaceCache, this.workspaceCache = [], 'workspace', workspaceFolders, {
			find: settings.findExtWorkspace,
			type: 'file',
			maxDepth: settings.get('workspace.maxDepthRecursion', 1),
			ignore: settings.get('workspace.ignore', []),
		}), this.detectWorkspacesFor(states.updateSubfolderCache, this.subfolderCache = [], 'subfolder', subfolderFolders, {
			find: null,
			type: 'folder',
			maxDepth: 1,
			ignore: settings.get('subfolder.ignore', []),
		})))
		.then(() => this.refreshWorkspacesCache())
		.then(() => this.cleanupUnknownPaths())
		.then(() => this._onDidChangeCache.fire());
		
	}
	
	private detectWorkspacesFor (updateCacheCallback:UpdateCacheCallback, workspaces:Project[], type:WorkspaceTypes, paths:string[], options:Options) {
		
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
				
				updateCacheCallback(this.context, workspaces);
				
			}, (error) => { vscode.window.showErrorMessage(error.message); })];
		}
		
		return [];
		
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