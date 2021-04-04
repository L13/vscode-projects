//	Imports ____________________________________________________________________

import * as fs from 'fs';
import * as vscode from 'vscode';

import { sortCaseInsensitive } from '../@l13/arrays';
import { formatLabel } from '../@l13/formats';
import { sanitize, subfolders, walkTree } from '../@l13/fse';

import { FileMap, Options } from '../@types/files';
import { Project, UpdateCacheCallback, WorkspaceTypes } from '../@types/workspaces';

import * as settings from '../common/settings';
import * as states from '../common/states';
import { findExtWorkspace } from '../common/workspaces';

//	Variables __________________________________________________________________

const findGitFolder = /^\.git$/;
const findVSCodeFolder = /^\.vscode$/;

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class WorkspacesState {
	
	private static current:WorkspacesState = null;
	
	public static create (context:vscode.ExtensionContext) {
		
		return WorkspacesState.current || (WorkspacesState.current = new WorkspacesState(context));
		
	}
	
	private _onDidChangeWorkspaces:vscode.EventEmitter<Project[]> = new vscode.EventEmitter<Project[]>();
	public readonly onDidChangeWorkspaces:vscode.Event<Project[]> = this._onDidChangeWorkspaces.event;
	
	public cache:Project[] = null;
	
	private gitCache:Project[] = [];
	private vscodeCache:Project[] = [];
	private workspaceCache:Project[] = [];
	private subfolderCache:Project[] = [];
	
	public constructor (private readonly context:vscode.ExtensionContext) {
		
		if (settings.get('useCacheForDetectedProjects', false)) this.get();
		
		this.gitCache = states.getGitCache(context);
		this.vscodeCache = states.getVSCodeCache(context);
		this.workspaceCache = states.getVSCodeWorkspaceCache(context);
		this.subfolderCache = states.getSubfolderCache(context);
		
	}
	
	public get () {
		
		return this.cache = states.getWorkspacesCache(this.context);
		
	}
	
	public getByPath (fsPath:string) {
		
		if (!this.workspaceCache) return null;
		
		for (const workspace of this.cache) {
			if (workspace.path === fsPath) return workspace;
		}
		
		return null;
		
	}
	
	private rebuild () {
		
		const projects = states.getProjects(this.context);
		
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
		
		this.cache = Object.values(once).sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
		
		states.updateWorkspacesCache(this.context, this.cache);
		
	}
	
	public refresh () {
		
		this.rebuild();
		
		this._onDidChangeWorkspaces.fire(this.cache);
		
	}
	
	public detect () {
		
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
				find: findExtWorkspace,
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
		]).then(() => {
			
			this.rebuild();
		
			this._onDidChangeWorkspaces.fire(this.cache);
			
			return this.cache;
			
		});
		
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
		
		path = sanitize(path);
			
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
		
		path = sanitize(path);
			
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