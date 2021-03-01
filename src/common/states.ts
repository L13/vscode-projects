//	Imports ____________________________________________________________________

import * as fs from 'fs';
import * as vscode from 'vscode';

import { Favorite, FavoriteGroup } from '../@types/favorites';
import { Slot } from '../@types/hotkeys';
import { GroupSimpleState, GroupTypeState, Project, WorkspaceGroup } from '../@types/workspaces';

//	Variables __________________________________________________________________

const SLOTS = 'slots';
const CURRENT_WORKSPACE = 'workspace';

const FAVORITES = 'favorites';
const FAVORITE_GROUPS = 'favoriteGroups';

const PROJECTS = 'projects';
const WORKSPACE_GROUPS = 'workspaceGroups';

const GROUP_STATES_BY_TYPE = 'groupStatesByType';
const GROUP_STATES_BY_SIMPLE = 'groupStatesBySimple';

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function getSlots (context:vscode.ExtensionContext) {
	
	return context.globalState.get(SLOTS, []);
	
}

export function updateSlots (context:vscode.ExtensionContext, slots:Slot[]) {
	
	context.globalState.update(SLOTS, slots);
	
}

export function getCurrentWorkspace (context:vscode.ExtensionContext) {
	
	return context.globalState.get(CURRENT_WORKSPACE, []);
	
}

export function updateCurrentWorkspace (context:vscode.ExtensionContext, workspacePaths:string[]) {
	
	context.globalState.update(CURRENT_WORKSPACE, workspacePaths.slice(0, 2));
	
}

export function getFavorites (context:vscode.ExtensionContext, checkDeleted:boolean = false) {
	
	const favorites:Favorite[] = context.globalState.get(FAVORITES) || [];
	
	if (checkDeleted) favorites.forEach((favorite) => favorite.deleted = !fs.existsSync(favorite.path));
	
	return favorites;
	
}

export function updateFavorites (context:vscode.ExtensionContext, favorites:Favorite[]) {
	
	context.globalState.update(FAVORITES, favorites);
	
}

export function getFavoriteGroups (context:vscode.ExtensionContext) :FavoriteGroup[] {
	
	return context.globalState.get(FAVORITE_GROUPS, []);
	
}

export function updateFavoriteGroups (context:vscode.ExtensionContext, favoriteGroups:FavoriteGroup[]) {
	
	context.globalState.update(FAVORITE_GROUPS, favoriteGroups);
	
}

export function getProjects (context:vscode.ExtensionContext) :Project[] {
	
	return context.globalState.get(PROJECTS, []);
	
}

export function updateProjects (context:vscode.ExtensionContext, projects:Project[]) {
	
	context.globalState.update(PROJECTS, projects);
	
}

export function getWorkspaceGroups (context:vscode.ExtensionContext) :WorkspaceGroup[] {
	
	return context.globalState.get(WORKSPACE_GROUPS, []);
	
}

export function updateWorkspaceGroups (context:vscode.ExtensionContext, workspaceGroups:WorkspaceGroup[]) {
	
	context.globalState.update(WORKSPACE_GROUPS, workspaceGroups);
	
}
	
export function getGroupSimpleStates (context:vscode.ExtensionContext) :GroupSimpleState[] {
	
	return context.globalState.get(GROUP_STATES_BY_SIMPLE, []);
	
}
	
export function updateGroupSimpleStates (context:vscode.ExtensionContext, groupStates:GroupSimpleState[]) {
	
	context.globalState.get(GROUP_STATES_BY_SIMPLE, groupStates);
	
}

export function getGroupTypeStates (context:vscode.ExtensionContext) :GroupTypeState[] {
	
	return context.globalState.get(GROUP_STATES_BY_TYPE, []);
	
}

export function updateGroupTypeStates (context:vscode.ExtensionContext, groupStates:GroupTypeState[]) {
	
	context.globalState.get(GROUP_STATES_BY_TYPE, groupStates);
	
}

export function getNextGroupId (context:vscode.ExtensionContext) :number {
	
	const favoriteGroups = getFavoriteGroups(context);
	const workspaceGroups = getWorkspaceGroups(context);
	
	if (!favoriteGroups.length && !workspaceGroups.length) return 0;
	
	const groupIds:number[] = [];
	
	favoriteGroups.forEach((favoriteGroup) => groupIds.push(favoriteGroup.id));
	workspaceGroups.forEach((workspaceGroup) => groupIds.push(workspaceGroup.id));
	
	const maxGroupId = Math.max.apply(null, groupIds);
	let i = 0;
	
	while (i <= maxGroupId) {
		if (!groupIds.includes(i)) return i;
		i++;
	}
	
	return i;
	
}

//	Functions __________________________________________________________________

