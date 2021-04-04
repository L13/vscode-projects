//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export type Comparison = {
	fileA:string,
	fileB:string,
	label:string,
	desc:string,
};

export type Favorite = {
	fileA:string;
	fileB:string;
	label:string;
	groupId?:number;
};

export interface FavoriteTreeItem extends vscode.TreeItem {
	
	contextValue:'favorite'|'subfavorite';
	
	readonly favorite:Favorite;
	
}

export interface HistoryTreeItem extends vscode.TreeItem {
	
	contextValue:'history';
	
	readonly comparison:Comparison;
	
}

//	Functions __________________________________________________________________