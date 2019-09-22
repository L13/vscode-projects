//	Imports ____________________________________________________________________

import { CurrentProjectTreeItem } from './CurrentProjectTreeItem';
import { ProjectTreeItem } from './ProjectTreeItem';
import { UnknownProjectTreeItem } from './UnknownProjectTreeItem';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export type Project = {
	path:string,
	label:string,
	type:'folder'|'folders'|'git'|'vscode'|'workspace',
	deleted?:boolean,
};

export type TreeItems = ProjectTreeItem|CurrentProjectTreeItem|UnknownProjectTreeItem;

//	Functions __________________________________________________________________

