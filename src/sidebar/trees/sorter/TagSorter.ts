//	Imports ____________________________________________________________________

import { formatTagDescription } from '../../../@l13/formats';

import type { TagGroup } from '../../../@types/tags';
import type { WorkspacesTreeItems } from '../../../@types/workspaces';
import type { StaticSorter } from '../../../@types/WorkspacesSorter';

import type { WorkspaceGroupsState } from '../../../states/WorkspaceGroupsState';

import type { WorkspacesProvider } from '../../WorkspacesProvider';

import { TagGroupTreeItem } from '../groups/TagGroupTreeItem';

import { TagTreeItem } from '../items/TagTreeItem';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class TagSorter implements StaticSorter {
	
	public groupRefs = [TagGroupTreeItem];
	
	private tagGroup: TagGroup = {
		label: 'Tags',
		collapsed: false,
	};
	
	public constructor (private readonly provider: WorkspacesProvider, private readonly workspaceGroupsState: WorkspaceGroupsState) {
		
		if (provider.initialState === 'remember') {
			this.tagGroup.collapsed = workspaceGroupsState.getTagGroup()?.collapsed ?? false;
		} else {
			const collapsed = provider.initialState === 'collapsed';
			this.tagGroup.collapsed = collapsed;
		}
		
	}
	
	public addGroups (list: WorkspacesTreeItems[]) {
		
		if (this.provider.showTagsInWorkspaces) list.push(new TagGroupTreeItem(this.tagGroup));
		
	}
	
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public addItems (list: WorkspacesTreeItems[], element: WorkspacesTreeItems) {
		
		const provider = this.provider;
		const slots = provider.slots;
		const tagDescriptionFormat = provider.tagDescriptionFormat;
		
		for (const tag of provider.tags) {
			const slot = slots.getByTag(tag);
			const description = formatTagDescription(tag, slot, tagDescriptionFormat);
			list.push(new TagTreeItem(tag, description));
		}
		
	}
	
}

//	Functions __________________________________________________________________

