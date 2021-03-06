//	Imports ____________________________________________________________________

import * as fs from 'fs';
import * as vscode from 'vscode';

import { sortCaseInsensitive } from '../@l13/arrays';
import { formatLabel } from '../@l13/formats';
import { subfolders, walkTree } from '../@l13/fse';

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
	
	private _onDidChangeCache:vscode.EventEmitter<Project[]> = new vscode.EventEmitter<Project[]>();
	public readonly onDidChangeCache:vscode.Event<Project[]> = this._onDidChangeCache.event;
	
	public workspacesCache:Project[] = null;
	
	private gitCache:Project[] = [];
	private vscodeCache:Project[] = [];
	private workspaceCache:Project[] = [];
	private subfolderCache:Project[] = [];
	
	public constructor (private readonly context:vscode.ExtensionContext) {
		
		if (settings.get('useCacheForDetectedProjects', false)) this.getWorkspacesCache();
		
		this.gitCache = states.getGitCache(context);
		this.vscodeCache = states.getVSCodeCache(context);
		this.workspaceCache = states.getVSCodeWorkspaceCache(context);
		this.subfolderCache = states.getSubfolderCache(context);
		
	}
	
	public getWorkspacesCache () {
		
		return this.workspacesCache = states.getWorkspacesCache(this.context);
		
	}
	
	public getWorkspaceByPath (fsPath:string) {
		
		if (!this.workspaceCache) return null;
		
		for (const workspace of this.workspacesCache) {
			if (workspace.path === fsPath) return workspace;
		}
		
		return null;
		
	}
	
	private cleanupUnknownPaths () {
		
		const workspaceGroups = states.getWorkspaceGroups(this.context);
		const paths = this.workspacesCache.map((workspace) => workspace.path);
		
		workspaceGroups.forEach((workspaceGroup) => {
			
			workspaceGroup.paths = workspaceGroup.paths.filter((path) => paths.includes(path));
			
		});
		
		states.updateWorkspaceGroups(this.context, workspaceGroups);
		
	}
	
	private rebuildWorkspacesCache () {
		
		const projects = states.getProjects(this.context);
		
		projects.forEach((project) => project.deleted = !fs.existsSync(project.path));
		
		const once:{ [name:string]:Project } = {};
		const all = [
			...projects,
			...this.gitCache,
			...this.vscodeCache,
			...this.workspaceCache,
			...this.subfolderCache,
		];
		
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
		
		this.workspacesCache = Object.values(once).sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
		
		states.updateWorkspacesCache(this.context, this.workspacesCache);
		
	}
	
	public refreshWorkspacesCache () {
		
		this.rebuildWorkspacesCache();
		this.cleanupUnknownPaths();
		
		this._onDidChangeCache.fire(this.workspacesCache);
		
	}
	
	public detectWorkspaces () {
		
		const gitFolders = settings.get('git.folders', []);
		const vscodeFolders = settings.get('vsCode.folders', []);
		const workspaceFolders = settings.get('workspace.folders', []);
		const subfolderFolders = settings.get('subfolder.folders', []);
		
		return Promise.all([
			this.detectWorkspacesOfType('git', states.updateGitCache, this.gitCache = [], gitFolders, {
				find: findGitFolder,
				type: 'folder',
				maxDepth: settings.get('git.maxDepthRecursion', 1),
				ignore: settings.get('git.ignore', []),
			}),
			this.detectWorkspacesOfType('vscode', states.updateVSCodeCache, this.vscodeCache = [], vscodeFolders, {
				find: findVSCodeFolder,
				type: 'folder',
				maxDepth: settings.get('vsCode.maxDepthRecursion', 1),
				ignore: settings.get('vsCode.ignore', []),
			}),
			this.detectWorkspacesOfType('workspace', states.updateVSCodeWorkspaceCache, this.workspaceCache = [], workspaceFolders, {
				find: settings.findExtWorkspace,
				type: 'file',
				maxDepth: settings.get('workspace.maxDepthRecursion', 1),
				ignore: settings.get('workspace.ignore', []),
			}),
			this.detectWorkspacesOfType('subfolder', states.updateSubfolderCache, this.subfolderCache = [], subfolderFolders, {
				find: null,
				type: 'folder',
				maxDepth: 1,
				ignore: settings.get('subfolder.ignore', []),
			})
		])
		.then(() => this.refreshWorkspacesCache());
		
	}
	
	private detectWorkspacesOfType (type:WorkspaceTypes, updateCacheCallback:UpdateCacheCallback, workspaces:Project[], paths:string[], options:Options) {
		
		const promises:Promise<FileMap>[] = type === 'subfolder' ? createSubfolderDetection(paths, options) : createWorkspaceDetection(paths, options);
		
		if (promises.length) {
			return Promise.all(promises).then((results) => {
				
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
				
			}, (error) => { vscode.window.showErrorMessage(error.message); });
		}
		
		updateCacheCallback(this.context, workspaces);
		
		return Promise.resolve();
		
	}
	
}

//	Functions __________________________________________________________________

function createWorkspaceDetection (paths:string[], options:Options) {
	
	const promises:Promise<FileMap>[] = [];
	
	paths.forEach((path) => {
			
		if (fs.existsSync(path)) {
			promises.push(new Promise((resolve, reject) => {
				
				walkTree(path, options, (error, result) => {
					
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