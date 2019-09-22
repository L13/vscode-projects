//	Imports ____________________________________________________________________

import * as fs from 'fs';
import * as vscode from 'vscode';

import { getWorkspacePath, sortCaseInsensitive } from './common';
import { CurrentProjectTreeItem } from './CurrentProjectTreeItem';
import { ProjectsProvider } from './ProjectsProvider';
import { ProjectTreeItem } from './ProjectTreeItem';
import { Project, TreeItems } from './types';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class ProjectsFavoritesProvider implements vscode.TreeDataProvider<TreeItems> {

	private _onDidChangeTreeData:vscode.EventEmitter<TreeItems|undefined> = new vscode.EventEmitter<TreeItems|undefined>();
	public readonly onDidChangeTreeData:vscode.Event<TreeItems|undefined> = this._onDidChangeTreeData.event;
	
	public favorites:Project[] = [];
	
	public static currentProvider:ProjectsFavoritesProvider|undefined;
	
	public static createProvider (context:vscode.ExtensionContext) {
		
		return ProjectsFavoritesProvider.currentProvider || (ProjectsFavoritesProvider.currentProvider = new ProjectsFavoritesProvider(context));
		
	}

	private constructor (private context:vscode.ExtensionContext) {
		
		this.favorites = getFavorites(this.context);
		
	}

	public refresh () :void {
		
		this.favorites = getFavorites(this.context);
		
		this._onDidChangeTreeData.fire();
		
	}

	public getTreeItem (element:TreeItems) :vscode.TreeItem {
		
		return element;
		
	}

	public getChildren (element?:TreeItems) :Thenable<TreeItems[]> {
		
		const workspacePath:string = getWorkspacePath();
		
		return Promise.resolve(this.favorites.map((favorite) => {
			
			if (workspacePath && workspacePath === favorite.path) {
				return new CurrentProjectTreeItem(favorite);
			}
			
			return new ProjectTreeItem(favorite);
			
		}));

	}
	
	public static pickFavorite (context:vscode.ExtensionContext) {
		
		const favorites:Project[] = getFavorites(context);
		
		if (favorites.length) {
			const items = favorites.map((project) => ({
				label: project.label,
				description: project.path,
				detail: project.deleted ? '$(alert) Path does not exist' : '',
			}));
			vscode.window.showQuickPick(items, { placeHolder: 'Select a project' }).then((value:any) => {
				
				if (!value) return;
				
				const newWindow = vscode.workspace.getConfiguration('l13Projects').get('openInNewWindow', false);
				
				vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(value.description), newWindow);
				
			});
		}
		
	}
	
	public static addToFavorites (context:vscode.ExtensionContext, project:Project) {
			
		const favorites:Project[] = context.globalState.get('favorites') || [];
		
		if (favorites.some(({ path }) => path === project.path)) {
			return vscode.window.showErrorMessage(`Project '${project.label}' exists in favorites!`);
		}
		
		favorites.push({ label: project.label, path: project.path, type: project.type });
		favorites.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
		
		context.globalState.update('favorites', favorites);
		
		if (ProjectsFavoritesProvider.currentProvider) ProjectsFavoritesProvider.currentProvider.refresh();
		
		vscode.window.showInformationMessage(`Favorite '${project.label}' saved!`);
		
	}
	
	public static updateFavorite (context:vscode.ExtensionContext, favorite:Project) {
		
		const favorites:Project[] = context.globalState.get('favorites') || [];
		
		for (const fav of favorites) {
			if (fav.path === favorite.path) {
				fav.label = favorite.label;
				fav.type = favorite.type;
				favorites.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
				context.globalState.update('favorites', favorites);
				if (ProjectsFavoritesProvider.currentProvider) ProjectsFavoritesProvider.currentProvider.refresh();
				break;
			}
		}
		
	}
	
	public static renameFavorite (context:vscode.ExtensionContext, favorite:Project) {
		
		vscode.window.showInputBox({ value: favorite.label }).then((value) => {
					
			if (favorite.label === value || value === undefined) return;
			
			if (!value) {
				vscode.window.showErrorMessage(`Favorite with no name is not valid!`);
				return;
			}
			
			favorite.label = value;
			ProjectsFavoritesProvider.updateFavorite(context, favorite);
			ProjectsProvider.updateProject(context, favorite);
			vscode.window.showInformationMessage(`Saved "${value}" in favorites!`);
			
		});
		
	}
	
	public static removeFavorite (context:vscode.ExtensionContext, favorite:Project) {
		
		vscode.window.showInformationMessage(`Delete favorite "${favorite.label}"?`, { modal: true }, 'Delete').then((value) => {
			
			if (value) {
				const favorites:Project[] = context.globalState.get('favorites') || [];
				
				for (let i = 0; i < favorites.length; i++) {
					if (favorites[i].path === favorite.path) {
						favorites.splice(i, 1);
						context.globalState.update('favorites', favorites);
						if (ProjectsFavoritesProvider.currentProvider) ProjectsFavoritesProvider.currentProvider.refresh();
						return;
					}
				}
			}
			
		});
		
	}
	
	public static clearFavorites (context:vscode.ExtensionContext) {
		
		vscode.window.showInformationMessage(`Delete all favorites?'`, { modal: true }, 'Delete').then((value) => {
			
			if (value) {
				context.globalState.update('favorites', []);
				if (ProjectsFavoritesProvider.currentProvider) ProjectsFavoritesProvider.currentProvider.refresh();
			}
			
		});
		
	}
	
}

//	Functions __________________________________________________________________

function getFavorites (context:vscode.ExtensionContext) {
	
	const favorites:Project[] = context.globalState.get('favorites') || [];
		
	favorites.forEach((favorite) => favorite.deleted = !fs.existsSync(favorite.path));
	
	return favorites;
	
}