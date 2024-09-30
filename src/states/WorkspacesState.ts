//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { sortCaseInsensitive } from '../@l13/arrays';
import { sanitizePath, sanitizeUri } from '../@l13/fse';
import { isFileUri, isUri } from '../@l13/uris';

import type { Dictionary } from '../@types/basics';
import type { ScanResult, ScanFolder, WalkTreeOptions } from '../@types/files';
import type { Project, ProjectTypes, UpdateCacheCallback, WorkspaceTypes } from '../@types/workspaces';

import { walkTree } from '../common/fse';
import * as settings from '../common/settings';
import * as states from '../common/states';
import { createWorkspaceItem, findExtWorkspace } from '../common/workspaces';

//	Variables __________________________________________________________________

const findGitFolder = /^\.git$/;
const findVSCodeFolder = /^\.vscode$/;

const projectTypes: ProjectTypes[] = [
	'codespace',
	'container',
	'github',
	'wsl',
	
	'remote',
	'virtual',
	'ssh',
	
	'folder',
	'folders',
	'git',
	'vscode',
	'workspace',
	'subfolder',
];

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class WorkspacesState {
	
	private static current: WorkspacesState = null;
	
	public static create (context: vscode.ExtensionContext) {
		
		return WorkspacesState.current || (WorkspacesState.current = new WorkspacesState(context));
		
	}
	
	private _onDidChangeWorkspaces: vscode.EventEmitter<Project[]> = new vscode.EventEmitter<Project[]>();
	public readonly onDidChangeWorkspaces: vscode.Event<Project[]> = this._onDidChangeWorkspaces.event;
	
	private _onWillScanWorkspaces: vscode.EventEmitter<undefined> = new vscode.EventEmitter<undefined>();
	public readonly onWillScanWorkspaces: vscode.Event<undefined> = this._onWillScanWorkspaces.event;
	
	private _onDidScanWorkspaces: vscode.EventEmitter<undefined> = new vscode.EventEmitter<undefined>();
	public readonly onDidScanWorkspaces: vscode.Event<undefined> = this._onDidScanWorkspaces.event;
	
	private _onWillScanWorkspace: vscode.EventEmitter<ScanFolder> = new vscode.EventEmitter<ScanFolder>();
	public readonly onWillScanWorkspace: vscode.Event<ScanFolder> = this._onWillScanWorkspace.event;
	
	private _onDidScanWorkspace: vscode.EventEmitter<ScanResult> = new vscode.EventEmitter<ScanResult>();
	public readonly onDidScanWorkspace: vscode.Event<ScanResult> = this._onDidScanWorkspace.event;
	
	public cache: Project[] = null;
	
	private gitCache: Project[] = [];
	private vscodeCache: Project[] = [];
	private workspaceCache: Project[] = [];
	private subfolderCache: Project[] = [];
	
	private constructor (private readonly context: vscode.ExtensionContext) {
		
		if (settings.get('useCacheForDetectedProjects', false)) this.get();
		
		this.gitCache = states.getGitCache(context);
		this.vscodeCache = states.getVSCodeCache(context);
		this.workspaceCache = states.getVSCodeWorkspaceCache(context);
		this.subfolderCache = states.getSubfolderCache(context);
		
	}
	
	public get () {
		
		return this.cache = states.getWorkspacesCache(this.context);
		
	}
	
	public getByPath (fsPath: string) {
		
		if (!this.cache) return null;
		
		for (const workspace of this.cache) {
			if (workspace.path === fsPath) return workspace;
		}
		
		return null;
		
	}
	
	private rebuild () {
		
		const projects = states.getProjects(this.context);
		
		const once: Dictionary<Project> = {};
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
				for (const projectType of projectTypes) {
					if (type === projectType) return;
					if (workspace.type === projectType) return once[workspace.path] = workspace;
				}
			} else once[workspace.path] = workspace;
			
		});
		
		this.cache = Object.values(once).sort(({ label: a }, { label: b }) => sortCaseInsensitive(a, b));
		
		states.updateWorkspacesCache(this.context, this.cache);
		
	}
	
	public refresh () {
		
		this.rebuild();
		
		this._onDidChangeWorkspaces.fire(this.cache);
		
	}
	
	public detect () {
		
		const gitFolders = filterFilePaths(settings.get('git.folders', []));
		const vscodeFolders = filterFilePaths(settings.get('vsCode.folders', []));
		const workspaceFolders = filterFilePaths(settings.get('workspace.folders', []));
		const subfolderFolders = filterFilePaths(settings.get('subfolder.folders', []));
		
		this._onWillScanWorkspaces.fire(undefined);
		
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
				type: 'subfolder',
				maxDepth: 1,
				ignore: settings.get('subfolder.ignore', []),
			}),
		]).then(() => {
			
			this._onDidScanWorkspaces.fire(undefined);
			
			this.rebuild();
		
			this._onDidChangeWorkspaces.fire(this.cache);
			
			return this.cache;
			
		});
		
	}
	
	// eslint-disable-next-line max-len
	private detectWorkspacesOfType (type: WorkspaceTypes, updateCacheCallback: UpdateCacheCallback, workspaces: Project[], paths: string[], options: WalkTreeOptions) {
		
		options.done = (error, result) => this._onDidScanWorkspace.fire({ error, result, type });
		
		const promises = paths.map((path) => {
			
			this._onWillScanWorkspace.fire({ path, type });
			
			return walkTree(sanitize(path), options);
			
		});
		
		if (promises.length) {
			return Promise.all(promises).then((results) => {
				
				for (const result of results) {
					const root = result.root;
					for (const uri of result.uris) workspaces.push(createWorkspaceItem(uri, type, null, root));
				}
				
				workspaces.sort(({ label: a }: Project, { label: b }: Project) => sortCaseInsensitive(a, b));
				
				updateCacheCallback(this.context, workspaces);
				
			}, (error) => {
				
				vscode.window.showErrorMessage(error.message);
			
			});
		}
		
		updateCacheCallback(this.context, workspaces);
		
		return Promise.resolve();
		
	}
	
}

//	Functions __________________________________________________________________

function sanitize (path: string) {
	
	return isUri(path) ? sanitizeUri(path) : sanitizePath(path);
	
}

function filterFilePaths (paths: string[]) {
	
	return paths.filter((path) => !isUri(path) || isFileUri(path));
	
}