//	Imports ____________________________________________________________________

import { join } from 'path';
import { TreeItem } from 'vscode';

import { Project } from '../../@types/workspaces';

//	Variables __________________________________________________________________

const iconPath = join(__filename, '..', '..', 'images', 'picker', 'color-picker.svg');

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class ColorPickerTreeItem extends TreeItem {
	
	public project:Project = null;
	
	public contextValue = 'color-picker';
	
	public id = 'color-picker';
	
	public iconPath = iconPath;
	
}

//	Functions __________________________________________________________________

