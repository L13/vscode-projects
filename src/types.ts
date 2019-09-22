//	Imports ____________________________________________________________________

import * as fs from 'fs';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export type Callback = (error?:null|Error, result?:StatsMap) => void;

export type Dictionary<T> = { [token:string]:T };

export type File = {
	path:string,
	folder:string,
	relative:string,
	stat?:fs.Stats,
	type?:'file'|'folder'|'symlink',
};

export type WalkTreeJob = {
	error:null|Error,
	find:RegExp,
	type:'file'|'folder',
	ignore:null|RegExp,
	tasks:number,
	result:StatsMap,
	done:(error?:Error) => void,
};

export type CopyFilesJob = {
	error:null|Error,
	tasks:number,
	done:(error?:Error) => void,
};

export type Options = {
	find:RegExp,
	type:'file'|'folder',
	ignore?:string[],
	maxDepth?:number,
};

export type StatsMap = { [pathname:string]:File };

export type Uri = {
	fsPath:string,
};

//	Functions __________________________________________________________________

