//	Imports ____________________________________________________________________

import * as fs from 'fs';
import * as jsoncParser from 'jsonc-parser';
import * as path from 'path';
import * as vscode from 'vscode';

import { StatusbarColors } from '../@types/workspaces';

//	Variables __________________________________________________________________

export const findExtWorkspace = /\.code-workspace$/;

const COLOR_CUSTOMIZATIONS = 'workbench.colorCustomizations';

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function get (key:string, value?:any) {
	
	return vscode.workspace.getConfiguration('l13Projects').get(key, value);
	
}
	
export function update (key:string, value:any, global:boolean = true) {
	
	return vscode.workspace.getConfiguration('l13Projects').update(key, value, global);
	
}

export function isCodeWorkspace (workspacePath:string) {
		
	return findExtWorkspace.test(workspacePath);
	
}
	
export function getCurrentWorkspacePath () {
	
	const workspace = vscode.workspace;
	let uri:undefined|vscode.Uri = workspace.workspaceFile;
	
	if (!uri && workspace.workspaceFolders) uri = workspace.workspaceFolders[0].uri;
	
	return uri && uri.scheme !== 'untitled' ? uri.fsPath : '';
	
}

export function updateStatusBarColorSettings (workspacePath:string, statusbarColors:StatusbarColors) {
	
	const useCodeWorkspace = isCodeWorkspace(workspacePath);
	const workspaceSettingsPath = useCodeWorkspace ? workspacePath : path.join(workspacePath, '.vscode', 'settings.json');
	
	if (useCodeWorkspace || fs.existsSync(workspaceSettingsPath)) {
		updateSettingsFile(workspaceSettingsPath, statusbarColors, useCodeWorkspace);
	} else createSettingsFile(workspaceSettingsPath, statusbarColors);
	
}

//	Functions __________________________________________________________________

function updateSettingsFile (workspaceSettingsPath:string, statusbarColors:StatusbarColors, useCodeWorkspace:boolean) {
	
	const workspaceSettings:string = fs.readFileSync(workspaceSettingsPath, 'utf-8');
	const jsonpath = useCodeWorkspace ? ['settings', COLOR_CUSTOMIZATIONS] : [COLOR_CUSTOMIZATIONS];
	const json = jsoncParser.parse(workspaceSettings);
	let colorCustomizations:any = (useCodeWorkspace ? json.settings?.[COLOR_CUSTOMIZATIONS] : json[COLOR_CUSTOMIZATIONS]) || {};
	
	for (const [name, color] of Object.entries(statusbarColors)) {
		if (color) colorCustomizations[name] = color;
		else delete colorCustomizations[name];
	}
	
	if (!Object.keys(colorCustomizations).length) colorCustomizations = undefined;
	
	const [tabSize, insertSpaces] = indentSettings();
	const edits = jsoncParser.modify(workspaceSettings, jsonpath, colorCustomizations, {
		formattingOptions: {
			tabSize,
			insertSpaces,
		}
	});
	
	const modifiedWorkspaceSettings = jsoncParser.applyEdits(workspaceSettings, edits);
	const modifiedJson = jsoncParser.parse(modifiedWorkspaceSettings);
	
	if (useCodeWorkspace || Object.keys(modifiedJson).length)  {
		fs.writeFileSync(workspaceSettingsPath, modifiedWorkspaceSettings, 'utf-8');
	} else { // Clean up if config or folder is empty
		fs.unlinkSync(workspaceSettingsPath);
		const dirname = path.dirname(workspaceSettingsPath);
		if (!fs.readdirSync(dirname).length) fs.rmdirSync(dirname);
	}
	
}

function createSettingsFile (workspaceSettingsPath:string, statusbarColors:StatusbarColors) {
	
	const colorCustomizations:any = {};
	
	for (const [name, color] of Object.entries(statusbarColors)) {
		if (color) colorCustomizations[name] = color;
		else delete colorCustomizations[name];
	}
	
	if (Object.keys(colorCustomizations).length) {
		const [tabSize, insertSpaces] = indentSettings();
		const dirname = path.dirname(workspaceSettingsPath);
		if (!fs.existsSync(dirname)) fs.mkdirSync(dirname);
		fs.writeFileSync(workspaceSettingsPath, JSON.stringify({
			[COLOR_CUSTOMIZATIONS]: colorCustomizations,
		}, null, insertSpaces ? tabSize : '\t'));
	}
	
}

function indentSettings () :[number, boolean] {
	
	const configEditor = vscode.workspace.getConfiguration('editor');
	const tabSize = configEditor.get('tabSize', 4);
	const insertSpaces = configEditor.get('insertSpaces', true);
	
	return [tabSize, insertSpaces];
	
}