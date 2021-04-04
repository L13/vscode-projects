//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import { Favorite, FavoriteGroup } from '../@types/favorites';
import { Slot } from '../@types/hotkeys';
import { NextSession } from '../@types/sessions';
import { StateInfo } from '../@types/states';
import { Tag, TagGroupState } from '../@types/tags';
import { Project, SimpleGroupState, TypeGroupState, WorkspaceGroup } from '../@types/workspaces';

//	Variables __________________________________________________________________

const STATE_INFO = 'stateInfo';

const NEXT_SESSION = 'nextSession';

const TAGS = 'tags';

const SLOTS = 'slots';
const CURRENT_WORKSPACE = 'workspace';

const FAVORITES = 'favorites';
const FAVORITE_GROUPS = 'favoriteGroups';

const PROJECTS = 'projects';
const WORKSPACE_GROUPS = 'workspaceGroups';

const SIMPLE_GROUPS = 'groupStatesBySimple';
const TYPE_GROUPS = 'groupStatesByType';

const TAG_GROUP = 'tagGroup';

const WORKSPACES_CACHE = 'cache';
const GIT_CACHE = 'cacheGitProjects';
const VSCODE_CACHE = 'cacheVSCodeProjects';
const VSCODE_WORKSAPCE_CACHE = 'cacheWorkspaceProjects';
const SUBFOLDER_CACHE = 'cacheSubfolderProjects';

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function getStateInfo (context:vscode.ExtensionContext) :StateInfo {
		
	return context.globalState.get(STATE_INFO, { lastModified: 0 });
	
}

export function getNextSession (context:vscode.ExtensionContext) :NextSession {
	
	return context.globalState.get(NEXT_SESSION, null);
	
}

export function updateNextSession (context:vscode.ExtensionContext, session:NextSession) {
	
	context.globalState.update(NEXT_SESSION, session);
	
}

export function getTags (context:vscode.ExtensionContext) :Tag[] {
	
	return context.globalState.get(TAGS, []);
	
}

export function updateTags (context:vscode.ExtensionContext, tags:Tag[]) {
	
	context.globalState.update(TAGS, tags);
	
	updateStateInfo(context);
	
}

export function getSlots (context:vscode.ExtensionContext) :Slot[] {
	
	return context.globalState.get(SLOTS, []);
	
}

export function updateSlots (context:vscode.ExtensionContext, slots:Slot[]) {
	
	context.globalState.update(SLOTS, slots);
	
	updateStateInfo(context);
	
}

export function getCurrentWorkspace (context:vscode.ExtensionContext) :string[] {
	
	return context.globalState.get(CURRENT_WORKSPACE, []);
	
}

export function updateCurrentWorkspace (context:vscode.ExtensionContext, workspacePaths:string[]) {
	
	context.globalState.update(CURRENT_WORKSPACE, workspacePaths);
	
}

export function getFavorites (context:vscode.ExtensionContext) :Favorite[] {
	
	return context.globalState.get(FAVORITES, []);
	
}

export function updateFavorites (context:vscode.ExtensionContext, favorites:Favorite[]) {
	
	context.globalState.update(FAVORITES, favorites);
	
	updateStateInfo(context);
	
}

export function getFavoriteGroups (context:vscode.ExtensionContext) :FavoriteGroup[] {
	
	return context.globalState.get(FAVORITE_GROUPS, []);
	
}

export function updateFavoriteGroups (context:vscode.ExtensionContext, favoriteGroups:FavoriteGroup[]) {
	
	context.globalState.update(FAVORITE_GROUPS, favoriteGroups);
	
	updateStateInfo(context);
	
}

export function getProjects (context:vscode.ExtensionContext) :Project[] {
	
	return context.globalState.get(PROJECTS, []);
	
}

export function updateProjects (context:vscode.ExtensionContext, projects:Project[]) {
	
	context.globalState.update(PROJECTS, projects);
	
	updateStateInfo(context);
	
}

export function getWorkspaceGroups (context:vscode.ExtensionContext) :WorkspaceGroup[] {
	
	return context.globalState.get(WORKSPACE_GROUPS, []);
	
}

export function updateWorkspaceGroups (context:vscode.ExtensionContext, workspaceGroups:WorkspaceGroup[]) {
	
	context.globalState.update(WORKSPACE_GROUPS, workspaceGroups);
	
	updateStateInfo(context);
	
}
	
export function getTagGroup (context:vscode.ExtensionContext) :TagGroupState {
	
	return context.globalState.get(TAG_GROUP);
	
}
	
export function updateTagGroup (context:vscode.ExtensionContext, tagGroup:TagGroupState) {
	
	context.globalState.update(TAG_GROUP, tagGroup);
	
	updateStateInfo(context);
	
}
	
export function updateCollapseState (context:vscode.ExtensionContext, workspaceGroups:WorkspaceGroup[]) {
	
	context.globalState.update(WORKSPACE_GROUPS, workspaceGroups);
	
}
	
export function getSimpleGroups (context:vscode.ExtensionContext) :SimpleGroupState[] {
	
	return context.globalState.get(SIMPLE_GROUPS, []);
	
}
	
export function updateSimpleGroups (context:vscode.ExtensionContext, simpleGroups:SimpleGroupState[]) {
	
	context.globalState.update(SIMPLE_GROUPS, simpleGroups);
	
}

export function getTypeGroups (context:vscode.ExtensionContext) :TypeGroupState[] {
	
	return context.globalState.get(TYPE_GROUPS, []);
	
}

export function updateTypeGroups (context:vscode.ExtensionContext, typeGroups:TypeGroupState[]) {
	
	context.globalState.update(TYPE_GROUPS, typeGroups);
	
}

export function getWorkspacesCache (context:vscode.ExtensionContext) :Project[] {
	
	return context.globalState.get(WORKSPACES_CACHE, []);
	
}

export function updateWorkspacesCache (context:vscode.ExtensionContext, cache:Project[]) {
	
	context.globalState.update(WORKSPACES_CACHE, cache);
	
	updateStateInfo(context);
	
}

export function getGitCache (context:vscode.ExtensionContext) :Project[] {
	
	return context.globalState.get(GIT_CACHE, []);
	
}

export function updateGitCache (context:vscode.ExtensionContext, cache:Project[]) {
	
	context.globalState.update(GIT_CACHE, cache);
	
}

export function getVSCodeCache (context:vscode.ExtensionContext) :Project[] {
	
	return context.globalState.get(VSCODE_CACHE, []);
	
}

export function updateVSCodeCache (context:vscode.ExtensionContext, cache:Project[]) {
	
	context.globalState.update(VSCODE_CACHE, cache);
	
}

export function getVSCodeWorkspaceCache (context:vscode.ExtensionContext) :Project[] {
	
	return context.globalState.get(VSCODE_WORKSAPCE_CACHE, []);
	
}

export function updateVSCodeWorkspaceCache (context:vscode.ExtensionContext, cache:Project[]) {
	
	context.globalState.update(VSCODE_WORKSAPCE_CACHE, cache);
	
}

export function getSubfolderCache (context:vscode.ExtensionContext) :Project[] {
	
	return context.globalState.get(SUBFOLDER_CACHE, []);
	
}

export function updateSubfolderCache (context:vscode.ExtensionContext, cache:Project[]) {
	
	context.globalState.update(SUBFOLDER_CACHE, cache);
	
}

//	Functions __________________________________________________________________

function updateStateInfo (context:vscode.ExtensionContext) {
	
	context.globalState.update(STATE_INFO, {
		lastModified: +new Date(),
	});
	
}