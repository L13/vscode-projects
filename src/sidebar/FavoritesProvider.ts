//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import * as dialogs from '../common/dialogs';
import * as files from '../common/files';
import * as settings from '../common/settings';
import * as states from '../common/states';

import { remove, sortCaseInsensitive } from '../@l13/arrays';
import { Favorite, FavoriteGroup, FavoritesTreeItems } from '../@types/favorites';
import { InitialState } from '../@types/groups';
import { Project, WorkspaceGroup } from '../@types/workspaces';

import { HotkeySlots } from '../features/HotkeySlots';
import { CurrentFavoriteTreeItem } from './trees/CurrentFavoriteTreeItem';
import { FavoriteGroupTreeItem } from './trees/FavoriteGroupTreeItem';
import { FavoriteTreeItem } from './trees/FavoriteTreeItem';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class FavoritesProvider implements vscode.TreeDataProvider<FavoritesTreeItems> {
	
	private _onDidChangeTreeData:vscode.EventEmitter<FavoritesTreeItems|undefined> = new vscode.EventEmitter<FavoritesTreeItems|undefined>();
	public readonly onDidChangeTreeData:vscode.Event<FavoritesTreeItems|undefined> = this._onDidChangeTreeData.event;
	
	private static _onDidChangeFavorite:vscode.EventEmitter<Favorite> = new vscode.EventEmitter<Favorite>();
	public static readonly onDidChangeFavorite:vscode.Event<Favorite> = FavoritesProvider._onDidChangeFavorite.event;
	
	private static _onDidChangeFavoriteGroup:vscode.EventEmitter<FavoriteGroup> = new vscode.EventEmitter<FavoriteGroup>();
	public static readonly onDidChangeFavoriteGroup:vscode.Event<FavoriteGroup> = FavoritesProvider._onDidChangeFavoriteGroup.event;
	
	public favorites:Favorite[] = [];
	public favoriteGroups:FavoriteGroup[] = [];
	
	private slots:HotkeySlots = null;
	
	public static currentProvider:FavoritesProvider;
	
	public static createProvider (context:vscode.ExtensionContext) {
		
		return FavoritesProvider.currentProvider || (FavoritesProvider.currentProvider = new FavoritesProvider(context));
		
	}
	
	private constructor (private context:vscode.ExtensionContext) {
		
		this.favorites = states.getFavorites(context);
		this.favoriteGroups = states.getFavoriteGroups(context);
		this.slots = HotkeySlots.create(context);
		
		const initialState:InitialState = settings.get('initialFavoritesGroupState', 'Remember');
		
		if (initialState !== 'Remember') {
			this.favoriteGroups.forEach((favoriteGroup) => favoriteGroup.collapsed = initialState === 'Collapsed');
		}
		
	}
	
	public refresh () :void {
		
		this.favorites = states.getFavorites(this.context);
		this.favoriteGroups = states.getFavoriteGroups(this.context);
		
		this._onDidChangeTreeData.fire();
		
	}
	
	public getTreeItem (element:FavoritesTreeItems) :FavoritesTreeItems {
		
		return element;
		
	}
	
	public getChildren (element?:FavoritesTreeItems) :Thenable<FavoritesTreeItems[]> {
		
		const list:FavoritesTreeItems[] = [];
		
		if (!this.favorites.length && !this.favoriteGroups.length) return Promise.resolve(list);
		
		const workspacePath:string = settings.getCurrentWorkspacePath();
		let hasCurrentProject = false;
		const slots = this.slots;
		let paths:string[] = [];
		
		if (element) {
			paths = (<FavoriteGroupTreeItem>element).favoriteGroup.paths;
			this.favorites.forEach((favorite) => {
				
				if (!paths.includes(favorite.path)) return;
				
				const slot = slots.get(favorite);
				
				if (!hasCurrentProject && workspacePath && workspacePath === favorite.path) {
					hasCurrentProject = true;
					list.push(new CurrentFavoriteTreeItem(favorite, slot, true));
				} else list.push(new FavoriteTreeItem(favorite, slot, true));
				
			});
		} else {
			this.favoriteGroups.forEach((favoriteGroup) => {
				
				paths = paths.concat(favoriteGroup.paths);
				list.push(new FavoriteGroupTreeItem(favoriteGroup));
				
			});
			this.favorites.forEach((favorite) => {
				
				if (paths.includes(favorite.path)) return;
				
				const slot = slots.get(favorite);
				
				if (!hasCurrentProject && workspacePath && workspacePath === favorite.path) {
					hasCurrentProject = true;
					list.push(new CurrentFavoriteTreeItem(favorite, slot));
				} else list.push(new FavoriteTreeItem(favorite, slot));
				
			});
		}
		
		return Promise.resolve(list);
		
	}
	
	public static async pickFavorite (context:vscode.ExtensionContext) {
		
		const favorites = states.getFavorites(context, true);
		const favoriteGroups = states.getFavoriteGroups(context);
		
		if (favorites.length || favoriteGroups.length) {
			const groups = favoriteGroups.map((favoriteGroup) => {
				
				const paths = favoriteGroup.paths;
				const names = favorites.filter((favorite) => paths.includes(favorite.path));
				
				return {
					label: favoriteGroup.label,
					description: names.map((favorite) => favorite.label).join(', '),
					paths: favoriteGroup.paths,
				};
				
			});
			const items = favorites.map((favorite) => ({
				label: favorite.label,
				description: favorite.path,
				detail: favorite.deleted ? '$(alert) Path does not exist' : '',
				paths: null,
			}));
			
			const item = await vscode.window.showQuickPick(groups.concat(items), { placeHolder: 'Select a project' });
				
			if (item) {
				if (item.paths) files.openAll(item.paths);
				else files.open(item.description);
			}
		}
		
	}
	
	public static addToFavorites (context:vscode.ExtensionContext, workspace:Project) {
		
		const favorites = states.getFavorites(context);
		
		if (favorites.some(({ path }) => path === workspace.path)) {
			return vscode.window.showErrorMessage(`Project "${workspace.label}" exists in favorites!`);
		}
		
		favorites.push({
			label: workspace.label,
			path: workspace.path,
			type: workspace.type,
			color: workspace.color,
		});
		
		favorites.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
		
		states.updateFavorites(context, favorites);
		FavoritesProvider.currentProvider?.refresh();
		
	}
	
	public static updateFavorite (context:vscode.ExtensionContext, workspace:Project) {
		
		const favorites = states.getFavorites(context);
		const fsPath = workspace.path;
		
		for (let i = 0; i < favorites.length; i++) {
			const favorite = favorites[i];
			if (favorite.path === fsPath) {
				if (!workspace.removed) {
					const type = favorite.type = workspace.type;
					if (type === 'folder' || type === 'folders') favorite.color = workspace.color;
					else delete favorite.color;
					favorite.label = workspace.label;
					favorites.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
				} else favorites.splice(i, 1);
				states.updateFavorites(context, favorites);
				FavoritesProvider.currentProvider?.refresh();
				break;
			}
		}
		
	}
	
	public static async renameFavorite (context:vscode.ExtensionContext, favorite:Favorite) {
		
		const value = await vscode.window.showInputBox({ value: favorite.label });
		
		if (favorite.label === value || value === undefined) return;
		
		if (!value) return vscode.window.showErrorMessage(`Favorite with no name is not valid!`);
		
		favorite.label = value;
		FavoritesProvider.updateFavorite(context, favorite);
		FavoritesProvider._onDidChangeFavorite.fire(favorite);
		
	}
	
	public static async removeFavorite (context:vscode.ExtensionContext, favorite:Favorite) {
		
		if (await dialogs.confirm(`Delete favorite "${favorite.label}"?`, 'Delete')) {
			const favorites = states.getFavorites(context);
			
			for (let i = 0; i < favorites.length; i++) {
				if (favorites[i].path === favorite.path) {
					favorites.splice(i, 1);
					states.updateFavorites(context, favorites);
					FavoritesProvider.currentProvider?.refresh();
					return;
				}
			}
		}
		
	}
	
	public static async addFavoriteGroup (context:vscode.ExtensionContext) {
		
		const label = await vscode.window.showInputBox({
			placeHolder: 'Please enter a name for the group.',
		});
		
		if (!label) return;
		
		const favoriteGroups = states.getFavoriteGroups(context);
		
		for (const favoriteGroup of favoriteGroups) {
			if (favoriteGroup.label === label) return vscode.window.showErrorMessage(`Favorite group "${label}" exists!`);
		}
		
		favoriteGroups.push({ label, id: states.getNextGroupId(context), collapsed: false, paths: [] });
		favoriteGroups.sort(({ label:a }, { label:b }) => sortCaseInsensitive(a, b));
		states.updateFavoriteGroups(context, favoriteGroups);
		FavoritesProvider.currentProvider?.refresh();
		
	}
	
	public static async addFavoriteToGroup (context:vscode.ExtensionContext, favorite:Favorite) {
		
		const favoriteGroups = states.getFavoriteGroups(context);
		
		if (!favoriteGroups.length) await FavoritesProvider.addFavoriteGroup(context);
		
		const favoriteGroup = favoriteGroups.length > 1 ? await vscode.window.showQuickPick(favoriteGroups) : favoriteGroups[0];
		
		if (favoriteGroup && !favoriteGroup.paths.includes(favorite.path)) {
			favoriteGroups.some((group) => remove(group.paths, favorite.path));
			favoriteGroup.paths.push(favorite.path);
			favoriteGroup.paths.sort();
			states.updateFavoriteGroups(context, favoriteGroups);
			FavoritesProvider.currentProvider?.refresh();
			FavoritesProvider._onDidChangeFavoriteGroup.fire(favoriteGroup);
		}
		
	}
	
	public static async addWorkspaceGroupToFavorites (context:vscode.ExtensionContext, workspaceGroup:WorkspaceGroup, workspaces:Project[]) {
		
		const favoriteGroups = states.getFavoriteGroups(context);
		const label = workspaceGroup.label;
		
		for (const favoriteGroup of favoriteGroups) {
			if (favoriteGroup.label === label) {
				const BUTTON_REPLACE = 'Replace';
				const value = await vscode.window.showInformationMessage(`Replace favorite group "${label}"?`, 'Cancel', BUTTON_REPLACE);
				if (value !== BUTTON_REPLACE) return;
				remove(favoriteGroups, favoriteGroup);
				break;
			}
		}
		
		const paths = workspaceGroup.paths;
		const link = settings.get('linkFavoriteAndWorkspaceGroups', true);
		
		for (const favoriteGroup of favoriteGroups) {
			for (const path of paths) remove(favoriteGroup.paths, path);
		}
		
		favoriteGroups.push({
			label,
			id: link ? workspaceGroup.id : states.getNextGroupId(context),
			collapsed: false,
			paths: workspaceGroup.paths
		});
		
		favoriteGroups.sort(({ label:a }, { label:b }) => sortCaseInsensitive(a, b));
		
		const favorites = states.getFavorites(context);
		
		workspaces: for (const workspace of workspaces) {
			for (const favorite of favorites) {
				if (favorite.path === workspace.path) continue workspaces;
			}
			favorites.push({
				label: workspace.label,
				path: workspace.path,
				type: workspace.type,
				color: workspace.color,
			});
		}
		
		favorites.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
		
		states.updateFavorites(context, favorites);
		states.updateFavoriteGroups(context, favoriteGroups);
		FavoritesProvider.currentProvider?.refresh();
		
	}
	
	public static async updateFavoriteGroup (context:vscode.ExtensionContext, workspaceGroup:FavoriteGroup) {
		
		const favoriteGroups = states.getFavoriteGroups(context);
		
		for (const favoriteGroup of favoriteGroups) {
			if (favoriteGroup.id === workspaceGroup.id) {
				favoriteGroup.label = workspaceGroup.label;
				favoriteGroup.paths = workspaceGroup.paths;
				favoriteGroups.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
				states.updateFavoriteGroups(context, favoriteGroups);
				FavoritesProvider.currentProvider?.refresh();
				break;
			}
		}
		
	}
	
	public static removeFromFavoriteGroup (context:vscode.ExtensionContext, favorite:Favorite) {
		
		const favoriteGroups = states.getFavoriteGroups(context);
		const favoriteGroup = favoriteGroups.find((group) => remove(group.paths, favorite.path));
		
		if (favoriteGroup) {
			states.updateFavoriteGroups(context, favoriteGroups);
			FavoritesProvider.currentProvider?.refresh();
			FavoritesProvider._onDidChangeFavoriteGroup.fire(favoriteGroup);
		}
		
	}
	
	public static async renameFavoriteGroup (context:vscode.ExtensionContext, favoriteGroup:FavoriteGroup) {
		
		const value = await vscode.window.showInputBox({
			placeHolder: 'Please enter a new name for the group.',
			value: favoriteGroup.label,
		});
		
		if (!value || favoriteGroup.label === value) return;
		
		const favoriteGroups = states.getFavoriteGroups(context);
		const groupId = favoriteGroup.id;
		
		for (const group of favoriteGroups) {
			if (group.id === groupId) {
				group.label = value;
				favoriteGroups.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
				states.updateFavoriteGroups(context, favoriteGroups);
				FavoritesProvider.currentProvider?.refresh();
				FavoritesProvider._onDidChangeFavoriteGroup.fire(group);
				break;
			}
		}
		
	}
	
	public static async removeFavoriteGroup (context:vscode.ExtensionContext, favoriteGroup:FavoriteGroup) {
		
		const BUTTON_DELETE_GROUP_AND_FAVORITES = 'Delete Group and Favorites';
		const value = await dialogs.confirm(`Delete favorite group "${favoriteGroup.label}"?`, 'Delete', BUTTON_DELETE_GROUP_AND_FAVORITES);
		
		if (value) {
			const favoriteGroups = states.getFavoriteGroups(context);
			const groupId = favoriteGroup.id;
			
			for (let i = 0; i < favoriteGroups.length; i++) {
				if (favoriteGroups[i].id === groupId) {
					favoriteGroups.splice(i, 1);
					break;
				}
			}
			
			if (value === BUTTON_DELETE_GROUP_AND_FAVORITES) {
				
				const favorites = states.getFavorites(context);
				const paths = favoriteGroup.paths;
				
				for (let i = 0; i < favorites.length; i++) {
					if (paths.includes(favorites[i].path)) favorites.splice(i, 1);
				}
				
				states.updateFavorites(context, favorites);
			}
			
			states.updateFavoriteGroups(context, favoriteGroups);
			FavoritesProvider.currentProvider?.refresh();
		}
		
	}
	
	public static saveCollapseState (context:vscode.ExtensionContext, item:FavoriteGroupTreeItem, state:boolean) {
		
		const favoriteGroups = states.getFavoriteGroups(context);
		const groupId = item.favoriteGroup.id;
		
		favoriteGroups.some((favoriteGroup) => favoriteGroup.id === groupId ? (favoriteGroup.collapsed = state) || true : false);
		
		states.updateFavoriteGroups(context, favoriteGroups);
		FavoritesProvider.currentProvider?.refresh();
		
	}
	
	public static async clearFavorites (context:vscode.ExtensionContext) {
		
		if (await dialogs.confirm(`Delete all favorites and groups?'`, 'Delete')) {
			states.updateFavorites(context, []);
			states.updateFavoriteGroups(context, []);
			FavoritesProvider.currentProvider?.refresh();
		}
		
	}
	
}

//	Functions __________________________________________________________________

