//	Imports ____________________________________________________________________

import * as fs from 'fs';
import * as vscode from 'vscode';

import * as dialogs from '../common/dialogs';
import * as files from '../common/files';
import * as settings from '../common/Settings';

import { sortCaseInsensitive } from '../@l13/arrays';
import { Project, TreeItems } from '../@types/workspaces';

import { HotkeySlots } from '../features/HotkeySlots';
import { CurrentProjectTreeItem } from './trees/CurrentProjectTreeItem';
import { ProjectTreeItem } from './trees/ProjectTreeItem';

//	Variables __________________________________________________________________

const FAVORITES = 'favorites';

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class FavoritesProvider implements vscode.TreeDataProvider<TreeItems> {
	
	private _onDidChangeTreeData:vscode.EventEmitter<TreeItems|undefined> = new vscode.EventEmitter<TreeItems|undefined>();
	public readonly onDidChangeTreeData:vscode.Event<TreeItems|undefined> = this._onDidChangeTreeData.event;
	
	private static _onDidChangeFavorite:vscode.EventEmitter<Project> = new vscode.EventEmitter<Project>();
	public static readonly onDidChangeFavorite:vscode.Event<Project> = FavoritesProvider._onDidChangeFavorite.event;
	
	public favorites:Project[] = [];
	
	private slots:HotkeySlots = null;
	
	public static currentProvider:FavoritesProvider;
	
	public static createProvider (context:vscode.ExtensionContext) {
		
		return FavoritesProvider.currentProvider || (FavoritesProvider.currentProvider = new FavoritesProvider(context));
		
	}
	
	private constructor (private context:vscode.ExtensionContext) {
		
		this.favorites = getFavorites(this.context);
		this.slots = HotkeySlots.create(this.context);
		
	}
	
	public refresh () :void {
		
		this.favorites = getFavorites(this.context);
		
		this._onDidChangeTreeData.fire();
		
	}
	
	public getTreeItem (element:TreeItems) :vscode.TreeItem {
		
		return element;
		
	}
	
	public getChildren (element?:TreeItems) :Thenable<TreeItems[]> {
		
		const workspacePath:string = settings.getCurrentWorkspacePath();
		let hasCurrentProject = false;
		const slots = this.slots;
		
		return Promise.resolve(this.favorites.map((favorite) => {
			
			const slot = slots.get(favorite);
			
			if (!hasCurrentProject && workspacePath && workspacePath === favorite.path) {
				hasCurrentProject = true;
				return new CurrentProjectTreeItem(favorite, slot);
			}
			
			return new ProjectTreeItem(favorite, slot);
			
		}));
		
	}
	
	public static async pickFavorite (context:vscode.ExtensionContext) {
		
		const favorites:Project[] = getFavorites(context, true);
		
		if (favorites.length) {
			const items = favorites.map((project) => ({
				label: project.label,
				description: project.path,
				detail: project.deleted ? '$(alert) Path does not exist' : '',
			}));
			
			const value = await vscode.window.showQuickPick(items, { placeHolder: 'Select a project' });
				
			if (value) files.open(value.description);
		}
		
	}
	
	public static addToFavorites (context:vscode.ExtensionContext, project:Project) {
		
		const favorites:Project[] = getFavorites(context);
		
		if (favorites.some(({ path }) => path === project.path)) {
			return vscode.window.showErrorMessage(`Project "${project.label}" exists in favorites!`);
		}
		
		favorites.push({ label: project.label, path: project.path, type: project.type });
		favorites.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
		
		context.globalState.update(FAVORITES, favorites);
		
		vscode.window.showInformationMessage(`Added "${project.label} to favorites."`);
		
		FavoritesProvider.currentProvider?.refresh();
		
	}
	
	public static updateFavorite (context:vscode.ExtensionContext, { color, path, label, type }:Project) {
		
		const favorites:Project[] = getFavorites(context);
		
		for (const favorite of favorites) {
			if (favorite.path === path) {
				favorite.label = label;
				favorite.type = type;
				favorite.color = color;
				favorites.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
				context.globalState.update(FAVORITES, favorites);
				FavoritesProvider.currentProvider?.refresh();
				break;
			}
		}
		
	}
	
	public static async renameFavorite (context:vscode.ExtensionContext, favorite:Project) {
		
		const value = await vscode.window.showInputBox({ value: favorite.label });
		
		if (favorite.label === value || value === undefined) return;
		
		if (!value) return vscode.window.showErrorMessage(`Favorite with no name is not valid!`);
		
		favorite.label = value;
		FavoritesProvider.updateFavorite(context, favorite);
		FavoritesProvider._onDidChangeFavorite.fire(favorite);
		
	}
	
	public static async removeFavorite (context:vscode.ExtensionContext, favorite:Project) {
		
		if (await dialogs.confirm(`Remove favorite "${favorite.label}"?`, 'Remove')) {
			const favorites:Project[] = getFavorites(context);
			
			for (let i = 0; i < favorites.length; i++) {
				if (favorites[i].path === favorite.path) {
					favorites.splice(i, 1);
					context.globalState.update(FAVORITES, favorites);
					FavoritesProvider.currentProvider?.refresh();
					return;
				}
			}
		}
		
	}
	
	public static async clearFavorites (context:vscode.ExtensionContext) {
		
		if (await dialogs.confirm(`Delete all favorites?'`, 'Delete')) {
			context.globalState.update(FAVORITES, []);
			FavoritesProvider.currentProvider?.refresh();
		}
		
	}
	
}

//	Functions __________________________________________________________________

function getFavorites (context:vscode.ExtensionContext, checkDeleted:boolean = false) {
	
	const favorites:Project[] = context.globalState.get(FAVORITES) || [];
	
	if (checkDeleted) favorites.forEach((favorite) => favorite.deleted = !fs.existsSync(favorite.path));
	
	return favorites;
	
}