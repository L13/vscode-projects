//	Imports ____________________________________________________________________

import * as fs from 'fs';
import * as vscode from 'vscode';

import * as dialogs from '../common/dialogs';
import * as files from '../common/files';
import * as settings from '../common/Settings';

import { sortCaseInsensitive } from '../@l13/arrays';
import { Favorite, FavoriteGroup, FavoriteTreeItems } from '../@types/favorites';
import { Project, TreeItems } from '../@types/workspaces';

import { HotkeySlots } from '../features/HotkeySlots';
import { CurrentProjectTreeItem } from './trees/CurrentProjectTreeItem';
import { FavoriteGroupTreeItem } from './trees/FavoriteGroupTreeItem';
import { ProjectTreeItem } from './trees/ProjectTreeItem';

//	Variables __________________________________________________________________

const FAVORITES = 'favorites';
const FAVORITE_GROUPS = 'favoriteGroups';

const BUTTON_DELETE_GROUP_AND_FAVORITES = 'Delete Group and Favorites';

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class FavoritesProvider implements vscode.TreeDataProvider<FavoriteTreeItems> {
	
	private _onDidChangeTreeData:vscode.EventEmitter<FavoriteTreeItems|undefined> = new vscode.EventEmitter<FavoriteTreeItems|undefined>();
	public readonly onDidChangeTreeData:vscode.Event<FavoriteTreeItems|undefined> = this._onDidChangeTreeData.event;
	
	private static _onDidChangeFavorite:vscode.EventEmitter<Favorite> = new vscode.EventEmitter<Favorite>();
	public static readonly onDidChangeFavorite:vscode.Event<Favorite> = FavoritesProvider._onDidChangeFavorite.event;
	
	public favorites:Favorite[] = [];
	public favoriteGroups:FavoriteGroup[] = [];
	
	private slots:HotkeySlots = null;
	
	public static currentProvider:FavoritesProvider;
	
	public static createProvider (context:vscode.ExtensionContext) {
		
		return FavoritesProvider.currentProvider || (FavoritesProvider.currentProvider = new FavoritesProvider(context));
		
	}
	
	private constructor (private context:vscode.ExtensionContext) {
		
		this.favorites = getFavorites(this.context);
		this.favoriteGroups = this.context.globalState.get(FAVORITE_GROUPS, []);
		this.slots = HotkeySlots.create(this.context);
		
	}
	
	public refresh () :void {
		
		this.favorites = getFavorites(this.context);
		
		this._onDidChangeTreeData.fire();
		
	}
	
	public getTreeItem (element:FavoriteTreeItems) :FavoriteTreeItems {
		
		return element;
		
	}
	
	public getChildren (element?:FavoriteTreeItems) :Thenable<FavoriteTreeItems[]> {
		
		const list:FavoriteTreeItems[] = [];
		
		if (!this.favorites.length && !this.favoriteGroups.length) return Promise.resolve(list);
		
		const workspacePath:string = settings.getCurrentWorkspacePath();
		let hasCurrentProject = false;
		const slots = this.slots;
		let groupId:number;
		
		if (element) {
			groupId = (<FavoriteGroupTreeItem>element).favoriteGroup.id;
			this.favoriteGroups.forEach((favoriteGroup) => list.push(new FavoriteGroupTreeItem(favoriteGroup)));
		}
		
		this.favorites.filter((favorite) => favorite.groupId === groupId).forEach((favorite) => {
				
			const slot = slots.get(favorite);
			
			if (!hasCurrentProject && workspacePath && workspacePath === favorite.path) {
				hasCurrentProject = true;
				return new CurrentProjectTreeItem(favorite, slot);
			}
			
			list.push(new ProjectTreeItem(favorite, slot));
			
		});
		
		return Promise.resolve(list);
		
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
		
		favorites.push({
			label: project.label,
			path: project.path,
			type: project.type,
			color: project.color,
		});
		
		favorites.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
		
		context.globalState.update(FAVORITES, favorites);
		
		vscode.window.showInformationMessage(`Added "${project.label}" to favorites`);
		
		FavoritesProvider.currentProvider?.refresh();
		
	}
	
	public static updateFavorite (context:vscode.ExtensionContext, project:Project) {
		
		const favorites:Favorite[] = getFavorites(context);
		const fsPath = project.path;
		
		for (let i = 0; i < favorites.length; i++) {
			const favorite = favorites[i];
			if (favorite.path === fsPath) {
				if (!project.removed) {
					const type = favorite.type = project.type;
					if (type === 'folder' || type === 'folders') favorite.color = project.color;
					else delete favorite.color;
					favorite.label = project.label;
					favorites.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
				} else favorites.splice(i, 1);
				context.globalState.update(FAVORITES, favorites);
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
			const favorites:Favorite[] = getFavorites(context);
			
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
	
	public static async addFavoriteGroup (context:vscode.ExtensionContext) {
		
		const label = await vscode.window.showInputBox({
			placeHolder: 'Please enter a name for the group.',
		});
		
		if (!label) return;
		
		const favoriteGroups:FavoriteGroup[] = context.globalState.get(FAVORITE_GROUPS, []);
		
		for (const favoriteGroup of favoriteGroups) {
			if (favoriteGroup.label === label) return vscode.window.showErrorMessage(`Favorite group "${label}" exists!`);
		}
		
		favoriteGroups.push({ label, id: getNextGroupId(favoriteGroups), collapsed: false });
		saveFavoriteGroup(context, favoriteGroups);
		
	}
	
	public static getFavoritesByGroup (context:vscode.ExtensionContext, favoriteGroup:FavoriteGroup) {
		
		const favorites = context.globalState.get(FAVORITES, []);
		
		return favorites.filter((favorite) => favorite.groupId === favoriteGroup.id);
		
	}
	
	public static async addToFavoriteGroup (context:vscode.ExtensionContext, favorite:Favorite) {
		
		const favoriteGroups:FavoriteGroup[] = context.globalState.get(FAVORITE_GROUPS, []);
		
		if (!favoriteGroups.length) await FavoritesProvider.addFavoriteGroup(context);
		
		const favoriteGroup = favoriteGroups.length > 1 ? await vscode.window.showQuickPick(favoriteGroups) : favoriteGroups[0];
		const favorites:Favorite[] = context.globalState.get(FAVORITES, []);
		
		if (favoriteGroup) {
			favorites.some((fav) => {
				
				if (fav.label === favorite.label) {
					fav.groupId = favoriteGroup.id;
					return true;
				}
				
				return false;
				
			});
			context.globalState.update(FAVORITES, favorites);
			FavoritesProvider.currentProvider?.refresh();
		}
		
	}
	
	public static removeFromFavoriteGroup (context:vscode.ExtensionContext, favorite:Favorite) {
		
		const favorites:Favorite[] = context.globalState.get(FAVORITES, []);
		
		favorites.some((fav) => {
			
			if (fav.label === favorite.label) {
				delete fav.groupId;
				return true;
			}
			
			return false;
			
		});
		
		context.globalState.update(FAVORITES, favorites);
		FavoritesProvider.currentProvider?.refresh();
		
	}
	
	public static saveCollapseState (context:vscode.ExtensionContext, item:FavoriteGroupTreeItem, state:boolean) {
		
		const favoriteGroups:FavoriteGroup[] = context.globalState.get(FAVORITE_GROUPS, []);
		const groupId = item.favoriteGroup.id;
		
		favoriteGroups.some((favoriteGroup) => favoriteGroup.id === groupId ? (favoriteGroup.collapsed = state) || true : false);
		
		context.globalState.update(FAVORITE_GROUPS, favoriteGroups);
		FavoritesProvider.currentProvider?.refresh();
		
	}
	
	public static async renameFavoriteGroup (context:vscode.ExtensionContext, favoriteGroup:FavoriteGroup) {
		
		const value = await vscode.window.showInputBox({
			placeHolder: 'Please enter a new name for the group.',
			value: favoriteGroup.label,
		});
		
		if (!value || favoriteGroup.label === value) return;
		
		const favoriteGroups:FavoriteGroup[] = context.globalState.get(FAVORITE_GROUPS, []);
		const groupId = favoriteGroup.id;
		
		for (const group of favoriteGroups) {
			if (group.id === groupId) {
				group.label = value;
				favoriteGroups.sort(({ label:a}, { label:b }) => sortCaseInsensitive(a, b));
				context.globalState.update(FAVORITE_GROUPS, favoriteGroups);
				FavoritesProvider.currentProvider?.refresh();
				break;
			}
		}
		
	}
	
	public static async removeFavoriteGroup (context:vscode.ExtensionContext, favoriteGroup:FavoriteGroup) {
		
		const value = await dialogs.confirm(`Delete favorite group "${favoriteGroup.label}"?`, 'Delete', BUTTON_DELETE_GROUP_AND_FAVORITES);
		
		if (value) {
			const favoriteGroups:FavoriteGroup[] = context.globalState.get(FAVORITE_GROUPS, []);
			const groupId = favoriteGroup.id;
			
			for (let i = 0; i < favoriteGroups.length; i++) {
				if (favoriteGroups[i].id === groupId) {
					favoriteGroups.splice(i, 1);
					let favorites:Favorite[] = context.globalState.get(FAVORITES, []);
					if (value === BUTTON_DELETE_GROUP_AND_FAVORITES) {
						favorites = favorites.filter((favorite) => favorite.groupId !== favoriteGroup.id);
					} else {
						favorites.forEach((favorite) => {
						
							if (favorite.groupId === favoriteGroup.id) delete favorite.groupId;
							
						});
					}
					context.globalState.update(FAVORITE_GROUPS, favoriteGroups);
					context.globalState.update(FAVORITES, favorites);
					FavoritesProvider.currentProvider?.refresh();
					break;
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
	
	const favorites:Favorite[] = context.globalState.get(FAVORITES) || [];
	
	if (checkDeleted) favorites.forEach((favorite) => favorite.deleted = !fs.existsSync(favorite.path));
	
	return favorites;
	
}

// function saveFavorite (context:vscode.ExtensionContext, favorites:Favorite[]) {
	
// 	favorites.sort(({ label:a }, { label:b }) => sortCaseInsensitive(a, b));
// 	context.globalState.update(FAVORITES, favorites);
// 	FavoritesProvider.currentProvider?.refresh();
	
// }

function saveFavoriteGroup (context:vscode.ExtensionContext, favoriteGroups:FavoriteGroup[]) {
	
	favoriteGroups.sort(({ label:a }, { label:b }) => sortCaseInsensitive(a, b));
	context.globalState.update(FAVORITE_GROUPS, favoriteGroups);
	FavoritesProvider.currentProvider?.refresh();
	
}

function getNextGroupId (favoriteGroups:FavoriteGroup[]) :number {
	
	if (!favoriteGroups.length) return 0;
	
	const groupIds = favoriteGroups.map((favoriteGroup) => favoriteGroup.id);
	const maxGroupId = Math.max.apply(null, groupIds);
	let i = 0;
	
	while (i <= maxGroupId) {
		if (!favoriteGroups.some((favoriteGroup) => favoriteGroup.id === i)) return i;
		i++;
	}
	
	return i;
	
}