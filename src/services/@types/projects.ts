//	Imports ____________________________________________________________________

import { CurrentProjectTreeItem } from '../sidebar/trees/CurrentProjectTreeItem';
import { GroupSimpleTreeItem } from '../sidebar/trees/GroupSimpleTreeItem';
import { GroupTypeTreeItem } from '../sidebar/trees/GroupTypeTreeItem';
import { ProjectTreeItem } from '../sidebar/trees/ProjectTreeItem';
import { UnknownProjectTreeItem } from '../sidebar/trees/UnknownProjectTreeItem';

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

