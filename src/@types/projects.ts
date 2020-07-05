//	Imports ____________________________________________________________________

import { CurrentProjectTreeItem } from '../services/sidebar/trees/CurrentProjectTreeItem';
import { ProjectTreeItem } from '../services/sidebar/trees/ProjectTreeItem';
import { UnknownProjectTreeItem } from '../services/sidebar/trees/UnknownProjectTreeItem';
import { GroupTreeItem } from './groups';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export type Project = {
	path:string,
	label:string,
	type:'folder'|'folders'|'git'|'vscode'|'workspace',
	deleted?:boolean,
};

export type TreeItems = CurrentProjectTreeItem|ProjectTreeItem|GroupTreeItem|UnknownProjectTreeItem;

//	Functions __________________________________________________________________

