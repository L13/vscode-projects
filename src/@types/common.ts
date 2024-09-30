//	Imports ____________________________________________________________________

import type { FavoriteTreeItems } from '../@types/favorites';
import type { WorkspaceTreeItems } from '../@types/workspaces';

import { FavoriteGroupTreeItem } from '../sidebar/trees/groups/FavoriteGroupTreeItem';
import { WorkspaceGroupTreeItem } from '../sidebar/trees/groups/WorkspaceGroupTreeItem';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export type CommonTreeItems = FavoriteTreeItems|WorkspaceTreeItems;

export type CommonGroupTreeItems = FavoriteGroupTreeItem|WorkspaceGroupTreeItem;

export type InitialState = 'collapsed' | 'expanded' | 'remember';

export type WorkspaceSorting = 'category' | 'name' | 'root' | 'type';

export type WorkspaceDescriptionFormat = 'both' | 'none' | 'slot' | 'tags';

export type TagDescriptionFormat = 'both' | 'none' | 'slot' | 'workspaces';

export type GroupDescriptionFormat = 'both' | 'none' | 'slot' | 'workspaces';

//	Functions __________________________________________________________________

