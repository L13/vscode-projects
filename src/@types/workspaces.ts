//	Imports ____________________________________________________________________

import { ColorPickerTreeItem } from '../sidebar/trees/ColorPickerTreeItem';
import { CurrentProjectTreeItem } from '../sidebar/trees/CurrentProjectTreeItem';
import { ProjectTreeItem } from '../sidebar/trees/ProjectTreeItem';
import { UnknownProjectTreeItem } from '../sidebar/trees/UnknownProjectTreeItem';
import { GroupTreeItem } from './groups';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export type Project = {
	path:string,
	label:string,
	type:'folder'|'folders'|'git'|'vscode'|'workspace',
	color?:number,
	deleted?:boolean,
};

export type TreeItems = ColorPickerTreeItem|CurrentProjectTreeItem|ProjectTreeItem|GroupTreeItem|UnknownProjectTreeItem;

//	Functions __________________________________________________________________

