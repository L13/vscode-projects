//	Imports ____________________________________________________________________

import type { WorkspacesTreeItems } from './workspaces';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export interface WorkspacesSorter extends StaticSorter {
	
	name: string;
	
}

export interface StaticSorter {
	
	groupRefs: any[];
	
	addGroups: (list: WorkspacesTreeItems[]) => void;
	
	addItems: (list: WorkspacesTreeItems[], element: WorkspacesTreeItems) => void;
	
}

//	Functions __________________________________________________________________

