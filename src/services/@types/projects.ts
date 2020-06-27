//	Imports ____________________________________________________________________

import { CurrentProjectTreeItem } from '../trees/CurrentProjectTreeItem';
import { GroupSimpleTreeItem } from '../trees/GroupSimpleTreeItem';
import { GroupTypeTreeItem } from '../trees/GroupTypeTreeItem';
import { ProjectTreeItem } from '../trees/ProjectTreeItem';
import { UnknownProjectTreeItem } from '../trees/UnknownProjectTreeItem';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export type Project = {
	path:string,
	label:string,
	type:'folder'|'folders'|'git'|'vscode'|'workspace',
	deleted?:boolean,
};

export type TreeItems = CurrentProjectTreeItem|ProjectTreeItem|GroupSimpleTreeItem|GroupTypeTreeItem|UnknownProjectTreeItem;

//	Functions __________________________________________________________________

