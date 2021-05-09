//	Imports ____________________________________________________________________

import { basename } from 'path';

import type { GroupDescriptionFormat, TagDescriptionFormat, WorkspaceDescriptionFormat } from '../@types/common';
import type { Plural } from '../@types/formats';
import type { Slot } from '../@types/hotkeys';
import type { Tag } from '../@types/tags';
import type { Project } from '../@types/workspaces';

import { pluralWorkspaces } from './units/projects';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function formatAmount (value:number, units:Plural) {
	
	return `${value} ${units[value] || units.size}`;
	
}

export function formatLabel (value:string) {
	
	return basename(value, '.code-workspace');
	
}

export function formatWorkspaceDescription (workspace:Project, slot:Slot, tags:Tag[], formatType:WorkspaceDescriptionFormat) {
	
	const desc:string[] = [];
	
	if (slot && (formatType === 'both' || formatType === 'slot')) desc.push(`[${slot.index}]`);
	if (formatType === 'both' || formatType === 'tags') {
		const path = workspace.path;
		const names = tags.filter(({ paths }) => paths.includes(path)).map(({ label }) => label);
		if (names.length) desc.push(names.join(', '));
	}
	if (workspace.deleted) {
		if (desc.length) desc.unshift('•');
		desc.unshift('Path does not exist');
	}
	
	return desc.join(' ');
	
}

export function formatTagDescription (tag:Tag, slot:Slot, formatType:TagDescriptionFormat) {
	
	const desc:string[] = [];
	
	if (tag.paths.length && (formatType === 'both' || formatType === 'workspaces')) {
		desc.push(formatAmount(tag.paths.length, pluralWorkspaces));
	}
	if (slot && (formatType === 'both' || formatType === 'slot')) desc.push(`[${slot.index}]`);
	
	return desc.join(' ');
	
}

export function formatGroupDescription (amount:number, slot:Slot, formatType:GroupDescriptionFormat) {
	
	const desc:string[] = [];
	
	if (amount && (formatType === 'both' || formatType === 'workspaces')) {
		desc.push(formatAmount(amount, pluralWorkspaces));
	}
	if (slot && (formatType === 'both' || formatType === 'slot')) desc.push(`[${slot.index}]`);
	
	return desc.join(' ');
	
}

//	Functions __________________________________________________________________

