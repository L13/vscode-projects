//	Imports ____________________________________________________________________

import { join, normalize } from 'path';

import type { ContextTypes, Project, ViewContext } from '../@types/workspaces';

//	Variables __________________________________________________________________

const baseCurrentPath = normalize(join(__dirname, '..', 'images', 'current'));
const baseTypesPath = normalize(join(__dirname, '..', 'images', 'types'));

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function getContextValue (project: Project, isSubItem: boolean, context?: ViewContext) {
		
	const type = getContextType(project.type);
	const remote = project.remote;
	
	return `${remote ? 'remote-' : ''}${isSubItem ? 'sub' : ''}${context || 'project'}-${type}`;
	
}

export function getDescription (info: string) {
	
	return `◀ Current Workspace${info ? ` • ${info}` : ''}`;
	
}

export function getIconPath (project: Project, isCurrent?: boolean) {
		
	const type = project.type;
	const remote = project.remote;
	const basePath = isCurrent ? baseCurrentPath : baseTypesPath;
	
	let icon = `${isCurrent ? 'current-' : ''}${remote ? 'remote' : 'project'}-${type}`;
	
	if (type === 'folder' || type === 'folders') icon += `-color-${project.color || 0}`;
	
	return {
		light: join(basePath, `${icon}-light.svg`),
		dark: join(basePath, `${icon}-dark.svg`),
	};
	
}

//	Functions __________________________________________________________________

function getContextType (type: Project['type']): ContextTypes {
	
	switch (type) {
		case 'codespace':
		case 'container':
		case 'docker':
		case 'kubernetes':
		case 'ssh':
		case 'wsl':
			return 'remote';
		case 'azure':
		case 'github':
			return 'virtual';
	}
	
	return type;
	
}