//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import type { DiffFavoriteTreeItem, DiffHistoryTreeItem } from '../@types/diff';

import * as commands from '../common/commands';
import * as sessions from '../common/sessions';

import { DiffFoldersDialog } from '../dialogs/DiffFoldersDialog';

import { ProjectsState } from '../states/ProjectsState';
import { SessionsState } from '../states/SessionsState';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function activate (context:vscode.ExtensionContext) {
	
	const projectsState = ProjectsState.create(context);
	const sessionsState = SessionsState.create(context);
	
	const diffFoldersDialog = DiffFoldersDialog.create(projectsState);
	
	commands.register(context, {
		'l13Projects.action.diff.favorite.openWorkspace': ({ favorite }:DiffFavoriteTreeItem) => {
					
			diffFoldersDialog.openWorkspace([favorite.fileA, favorite.fileB]);
			
		},

		'l13Projects.action.diff.favorite.openAsWorkspace': ({ favorite }:DiffFavoriteTreeItem) => {
			
			sessions.openAsWorkspace([favorite.fileA, favorite.fileB], sessionsState, projectsState);
			
		},

		'l13Projects.action.diff.favorite.addFoldersToWorkspace': ({ favorite }:DiffFavoriteTreeItem) => {
			
			sessions.addFoldersToWorkspace([favorite.fileA, favorite.fileB], projectsState);
			
		},
				
		'l13Projects.action.diff.favorite.revealInFinder': ({ favorite }:DiffFavoriteTreeItem) => {
					
			diffFoldersDialog.reveal([favorite.fileA, favorite.fileB]);
			
		},

		'l13Projects.action.diff.favorite.revealInExplorer': ({ favorite }:DiffFavoriteTreeItem) => {
			
			diffFoldersDialog.reveal([favorite.fileA, favorite.fileB]);
			
		},

		'l13Projects.action.diff.favorite.openContainingFolder': ({ favorite }:DiffFavoriteTreeItem) => {
			
			diffFoldersDialog.reveal([favorite.fileA, favorite.fileB]);
			
		},

		'l13Projects.action.diff.favorite.openInTerminal': ({ favorite }:DiffFavoriteTreeItem) => {
			
			diffFoldersDialog.openInTerminal([favorite.fileA, favorite.fileB]);
			
		},

		'l13Projects.action.diff.history.openWorkspace': ({ comparison }:DiffHistoryTreeItem) => {
			
			diffFoldersDialog.openWorkspace([comparison.fileA, comparison.fileB]);
			
		},

		'l13Projects.action.diff.history.openAsWorkspace': ({ comparison }:DiffHistoryTreeItem) => {
			
			sessions.openAsWorkspace([comparison.fileA, comparison.fileB], sessionsState, projectsState);
			
		},

		'l13Projects.action.diff.history.addFoldersToWorkspace': ({ comparison }:DiffHistoryTreeItem) => {
			
			sessions.addFoldersToWorkspace([comparison.fileA, comparison.fileB], projectsState);
			
		},
		
		'l13Projects.action.diff.history.revealInFinder': ({ comparison }:DiffHistoryTreeItem) => {
			
			diffFoldersDialog.reveal([comparison.fileA, comparison.fileB]);
			
		},
		
		'l13Projects.action.diff.history.revealInExplorer': ({ comparison }:DiffHistoryTreeItem) => {
			
			diffFoldersDialog.reveal([comparison.fileA, comparison.fileB]);
			
		},
		
		'l13Projects.action.diff.history.openContainingFolder': ({ comparison }:DiffHistoryTreeItem) => {
			
			diffFoldersDialog.reveal([comparison.fileA, comparison.fileB]);
			
		},
		
		'l13Projects.action.diff.history.openInTerminal': ({ comparison }:DiffHistoryTreeItem) => {
			
			diffFoldersDialog.openInTerminal([comparison.fileA, comparison.fileB]);
			
		},
	});

}

//	Functions __________________________________________________________________

