//	Imports ____________________________________________________________________

import * as jsoncParser from 'jsonc-parser';
import * as vscode from 'vscode';

import type { WorkspaceSorting } from '../@types/common';
import type { StatusBarColors } from '../@types/workspaces';

import * as fse from './fse';
import { isCodeWorkspace } from './workspaces';
import * as uris from './uris';

//	Variables __________________________________________________________________

const COLOR_CUSTOMIZATIONS = 'workbench.colorCustomizations';

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function get <T = any> (key: string, value?: any) {
	
	return vscode.workspace.getConfiguration('l13Projects').get<T>(key, value);
	
}
	
export function update (key: string, value: any, global = true) {
	
	return vscode.workspace.getConfiguration('l13Projects').update(key, value, global);
	
}

export function sortWorkspacesBy (): WorkspaceSorting {
	
	const value = get<string>('sortWorkspacesBy').toLowerCase();
	
	if (value === 'simple') {
		vscode.window.showWarningMessage('Settings: "Simple" for "l13Projects.sortWorkspacesBy" is depricated. Please use "category" instead.');
		return 'category';
	}
	
	return <WorkspaceSorting>value;
	
}

export function openInNewWindow (): boolean {
	
	return get('openInNewWindow', false);
	
}

export async function updateStatusBarColorSettings (workspacePath: string, statusbarColors: StatusBarColors) {
	
	const useCodeWorkspace = isCodeWorkspace(workspacePath);
	const workspaceSettingsPath = useCodeWorkspace ? workspacePath : getSettingsPath(workspacePath);
	
	if (await fse.exists(workspaceSettingsPath)) {
		updateSettingsFile(workspaceSettingsPath, statusbarColors, useCodeWorkspace);
	} else createSettingsFile(workspaceSettingsPath, statusbarColors);
	
}

export async function getStatusBarColorSettings (workspacePath: string) {
	
	const workspaceSettingsPath = isCodeWorkspace(workspacePath) ? workspacePath : getSettingsPath(workspacePath);
	
	if (await fse.exists(workspaceSettingsPath)) {
		const workspaceSettings = <string> await fse.readFile(workspaceSettingsPath, 'utf-8');
		const json = jsoncParser.parse(workspaceSettings);
		
		return json.settings?.[COLOR_CUSTOMIZATIONS] || json[COLOR_CUSTOMIZATIONS] || null;
	}
	
	return null;
	
}

export async function getWorkspaceFolders (workspacePath: string): Promise<Array<{ path: string }>> {
	
	const workspaceSettings = <string> await fse.readFile(workspacePath, 'utf-8');
	const json = jsoncParser.parse(workspaceSettings);
	
	return json?.folders || [];
	
}

export function isTrustedWorkspaceEnabled () {
	
	return vscode.workspace.getConfiguration().get('security.workspace.trust.enabled', false);
	
}

//	Functions __________________________________________________________________

function getSettingsPath (workspacePath: string) {
	
	return uris.getPath(vscode.Uri.joinPath(uris.createUri(workspacePath), '.vscode', 'settings.json'));
	
}

async function updateSettingsFile (workspacePath: string, statusbarColors: StatusBarColors, useCodeWorkspace: boolean) {
	
	const workspaceSettings = <string> await fse.readFile(workspacePath, 'utf-8');
	const jsonpath = useCodeWorkspace ? ['settings', COLOR_CUSTOMIZATIONS] : [COLOR_CUSTOMIZATIONS];
	const json = jsoncParser.parse(workspaceSettings);
	let colorCustomizations: any = (useCodeWorkspace ? json.settings?.[COLOR_CUSTOMIZATIONS] : json[COLOR_CUSTOMIZATIONS]) || {};
	
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
		},
	});
	
	const modifiedWorkspaceSettings = jsoncParser.applyEdits(workspaceSettings, edits);
	const modifiedJson = jsoncParser.parse(modifiedWorkspaceSettings);
	
	if (useCodeWorkspace || Object.keys(modifiedJson).length) {
		await fse.writeFile(uris.createUri(workspacePath), modifiedWorkspaceSettings);
	} else { // Clean up if config or folder is empty
		await fse.unlink(workspacePath);
		const dirname = uris.dirname(workspacePath);
		if (!(await fse.readDirectory(dirname)).length) fse.unlink(dirname);
	}
	
}

async function createSettingsFile (workspaceSettingsPath: string, statusbarColors: StatusBarColors) {
	
	const colorCustomizations: any = {};
	
	for (const [name, color] of Object.entries(statusbarColors)) {
		if (color) colorCustomizations[name] = color;
		else delete colorCustomizations[name];
	}
	
	if (Object.keys(colorCustomizations).length) {
		const [tabSize, insertSpaces] = indentSettings();
		const dirname = uris.dirname(workspaceSettingsPath);
		if (!await fse.exists(dirname)) fse.createDirectory(dirname);
		await fse.writeFile(workspaceSettingsPath, JSON.stringify({
			[COLOR_CUSTOMIZATIONS]: colorCustomizations,
		}, null, insertSpaces ? tabSize : '\t'));
	}
	
}

function indentSettings (): [number, boolean] {
	
	const configEditor = vscode.workspace.getConfiguration('editor');
	const tabSize = configEditor.get('tabSize', 4);
	const insertSpaces = configEditor.get('insertSpaces', true);
	
	return [tabSize, insertSpaces];
	
}