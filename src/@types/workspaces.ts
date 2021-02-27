//	Imports ____________________________________________________________________

import { ColorPickerTreeItem } from '../sidebar/trees/ColorPickerTreeItem';
import { CurrentProjectTreeItem } from '../sidebar/trees/CurrentProjectTreeItem';
import { ProjectTreeItem } from '../sidebar/trees/ProjectTreeItem';
import { UnknownProjectTreeItem } from '../sidebar/trees/UnknownProjectTreeItem';
import { GroupTreeItem } from './groups';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export type StatusbarColors = {
	'statusBar.background':string,
	'statusBar.foreground':string,
	'statusBarItem.hoverBackground':string,
};

export type Project = {
	path:string,
	label:string,
	type:'folder'|'folders'|WorkspaceTypes,
	color?:number,
	removed?:boolean,
	deleted?:boolean,
};

export type WorkspacesTreeItems = ColorPickerTreeItem|GroupTreeItem|WorkspaceTreeItems;

export type WorkspaceTreeItems = CurrentProjectTreeItem|ProjectTreeItem|UnknownProjectTreeItem;

export type WorkspaceGroup = {
	label:string,
	id:number,
	collapsed:boolean,
	paths:string[],
	type:'custom',
};

export type WorkspaceTypes = 'git'|'subfolder'|'vscode'|'workspace';

//	Functions __________________________________________________________________

