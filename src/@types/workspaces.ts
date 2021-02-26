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

export type TreeItems = ColorPickerTreeItem|CurrentProjectTreeItem|ProjectTreeItem|GroupTreeItem|UnknownProjectTreeItem;

// export type Workspace = {
// 	path:string,
// 	label:string,
// 	type:WorkspaceTypes,
// };

export type WorkspaceTypes = 'git'|'subfolder'|'vscode'|'workspace';

//	Functions __________________________________________________________________

