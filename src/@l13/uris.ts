//	Imports ____________________________________________________________________



//	Variables __________________________________________________________________

const findScheme = /^\w[\w+.-]*:(?!\\)/;
const findFileScheme = /^file:/;

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function isUri (fsPath: string) {
	
	return findScheme.test(fsPath);
	
}

export function isFileUri (fsPath: string) {
	
	return findFileScheme.test(fsPath);
	
}

//	Functions __________________________________________________________________

