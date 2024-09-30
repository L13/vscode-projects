//	Imports ____________________________________________________________________

import { posix } from 'path';
import * as vscode from 'vscode';

import { isUri } from '../@l13/uris';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function createUri (fsPath: string) {
	
	return isUri(fsPath) ? vscode.Uri.parse(fsPath, true) : vscode.Uri.file(fsPath);
	
}

export function getPath (uri: vscode.Uri) {
	
	return uri.scheme === 'file' ? uri.fsPath : uri.toString();
	
}
export function getUri (pathOrUri: string|vscode.Uri) {
	
	return typeof pathOrUri === 'string' ? createUri(pathOrUri) : pathOrUri;
	
}

export function isEqualUri (uriA: string|vscode.Uri, uriB: string|vscode.Uri) {
	
	return getUri(uriA).toString() === getUri(uriB).toString();
	
}

export function dirname (pathOrUri: string|vscode.Uri) {
	
	let uri = getUri(pathOrUri);
	
	uri = uri.with({ path: posix.dirname(uri.path) });
	
	return typeof pathOrUri === 'string' ? getPath(uri) : uri;
	
}

export function basename (pathOrUri: string|vscode.Uri) {
	
	return posix.basename(getUri(pathOrUri).path);
	
}

export function extname (pathOrUri: string|vscode.Uri) {
	
	return posix.extname(getUri(pathOrUri).path);
	
}

//	Functions __________________________________________________________________

