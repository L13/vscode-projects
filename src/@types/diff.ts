//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

type Comparison = {
	fileA: string,
	fileB: string,
	label: string,
	desc: string,
};

type Favorite = {
	fileA: string;
	fileB: string;
	label: string;
	groupId?: number;
};

export interface DiffFavoriteTreeItem extends vscode.TreeItem {
	
	contextValue: 'favorite'|'subfavorite';
	
	readonly favorite: Favorite;
	
}

export interface DiffHistoryTreeItem extends vscode.TreeItem {
	
	contextValue: 'history';
	
	readonly comparison: Comparison;
	
}

//	Functions __________________________________________________________________