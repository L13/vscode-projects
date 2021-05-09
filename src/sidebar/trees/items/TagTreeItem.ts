//	Imports ____________________________________________________________________

import { join } from 'path';
import { TreeItem } from 'vscode';

import type { Tag } from '../../../@types/tags';

//	Variables __________________________________________________________________

const basePath = join(__dirname, '..', 'images', 'tags');
const iconPath = {
	light: join(basePath, 'tag-light.svg'),
	dark: join(basePath, 'tag-dark.svg'),
};

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class TagTreeItem extends TreeItem {
	
	public command = {
		arguments: [this],
		command: 'l13Projects.action.tag.pickAndOpen',
		title: 'Open...',
	};
	
	public iconPath = iconPath;
	
	public contextValue = 'tag';
	
	public constructor (public readonly tag:Tag, info:string) {
		
		super(tag.label);
		
		this.description = info;
		
	}
	
}

//	Functions __________________________________________________________________

