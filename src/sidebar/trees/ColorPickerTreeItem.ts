//	Imports ____________________________________________________________________

import { join } from 'path';
import { TreeItem } from 'vscode';

import { Project } from '../../@types/workspaces';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class ColorPickerTreeItem extends TreeItem {
	
	public project:Project = null;
	
	public contextValue = 'color-picker';
	
	public id = 'color-picker';
	
	public constructor () {
		
		super('');
		
		this.iconPath = join(__filename, '..', '..', 'images', 'picker', 'color-picker.svg');
		
	}
	
}

//	Functions __________________________________________________________________

