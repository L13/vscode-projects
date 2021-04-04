//	Imports ____________________________________________________________________

import * as fs from 'fs';
import * as jsoncParser from 'jsonc-parser';
import * as path from 'path';
import * as vscode from 'vscode';

import { WorkspaceSorting } from '../@types/common';
import { StatusBarColors } from '../@types/workspaces';

import { isCodeWorkspace } from './workspaces';

//	Variables __________________________________________________________________

const COLOR_CUSTOMIZATIONS = 'workbench.colorCustomizations';

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function get (key:string, value?:any) {
	
	return vscode.workspace.getConfiguration('l13Projects').get(key, value);
	
}
	
export function update (key:string, value:any, global:boolean = true) {
	
	return vscode.workspace.getConfiguration('l13Projects').update(key, value, global);
	
}

export function sortWorkspacesBy () :WorkspaceSorting {
	
	const value = get('sortWorkspacesBy').toLowerCase();
	
	if (value === 'simple') {
		vscode.window.showWarningMessage('Settings: "Simple" for "l13Projects.sortWorkspacesBy" is depricated. Please use "category" instead.');
		return 'category';
	}
	
	return value;
	
}

export function openInNewWindow () :boolean {
	
	return get('openInNewWindow', false);
	
}

export function updateStatusBarColorSettings (workspacePath:string, statusbarColors:StatusBarColors) {
	
	const useCodeWorkspace = isCodeWorkspace(workspacePath);
	const workspaceSettingsPath = useCodeWorkspace ? workspacePath : getSettingsPath(workspacePath);
	
	if (fs.existsSync(workspaceSettingsPath)) updateSettingsFile(workspaceSettingsPath, statusbarColors, useCodeWorkspace);
	else createSettingsFile(workspaceSettingsPath, statusbarColors);
	
}

export function getStatusBarColorSettings (workspacePath:string) {
	
	const workspaceSettingsPath = isCodeWorkspace(workspacePath) ? workspacePath : getSettingsPath(workspacePath);
	
	if (fs.existsSync(workspaceSettingsPath)) {
		const workspaceSettings = fs.readFileSync(workspaceSettingsPath, 'utf-8');
		const json = jsoncParser.parse(workspaceSettings);
		
		return json.settings?.[COLOR_CUSTOMIZATIONS] || json[COLOR_CUSTOMIZATIONS] || null;
	}
	
	return null;
	
}

export function getWorkspaceFolders (workspacePath:string) :{ path:string }[] {
	
	const workspaceSettings = fs.readFileSync(workspacePath, 'utf-8');
	const json = jsoncParser.parse(workspaceSettings);
	
	return json?.folders || [];
	
}

//	Functions __________________________________________________________________

function getSettingsPath (workspacePath:string) {
	
	return path.join(workspacePath, '.vscode', 'settings.json');
	
}

function updateSettingsFile (workspacePath:string, statusbarColors:StatusBarColors, useCodeWorkspace:boolean) {
	
	const workspaceSettings:string = fs.readFileSync(workspacePath, 'utf-8');
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
		fs.writeFileSync(workspacePath, modifiedWorkspaceSettings, 'utf-8');
	} else { // Clean up if config or folder is empty
		fs.unlinkSync(workspacePath);
		const dirname = path.dirname(workspacePath);
		if (!fs.readdirSync(dirname).length) fs.rmdirSync(dirname);
	}
	
}

function createSettingsFile (workspaceSettingsPath:string, statusbarColors:StatusBarColors) {
	
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