//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import * as states from './states';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function getNextGroupId (context:vscode.ExtensionContext) :number {
	
	const favoriteGroups = states.getFavoriteGroups(context);
	const workspaceGroups = states.getWorkspaceGroups(context);
	
	if (!favoriteGroups.length && !workspaceGroups.length) return 0;
	
	const groupIds:number[] = [];
	
	favoriteGroups.forEach((favoriteGroup) => groupIds.push(favoriteGroup.id));
	workspaceGroups.forEach((workspaceGroup) => groupIds.push(workspaceGroup.id));
	
	const maxGroupId = Math.max.apply(null, groupIds);
	let i = 0;
	
	while (i <= maxGroupId) {
		if (!groupIds.includes(i)) return i;
		i++;
	}
	
	return i;
	
}

//	Functions __________________________________________________________________

