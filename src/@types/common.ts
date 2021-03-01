//	Imports ____________________________________________________________________

import { FavoriteTreeItems } from '../@types/favorites';
import { WorkspaceTreeItems } from '../@types/workspaces';

import { FavoriteGroupTreeItem } from '../sidebar/trees/FavoriteGroupTreeItem';
import { GroupCustomTreeItem } from '../sidebar/trees/GroupCustomTreeItem';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export type CommonTreeItems = FavoriteTreeItems|WorkspaceTreeItems;

export type CommonGroupTreeItems = FavoriteGroupTreeItem|GroupCustomTreeItem;

export type InitialState = 'Collapsed'|'Expanded'|'Remember';

export type WorkspaceSorting = 'Group'|'Name'|'Simple'|'Type';

//	Functions __________________________________________________________________

