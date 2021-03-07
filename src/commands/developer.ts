//	Imports ____________________________________________________________________

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

import { Favorite, FavoriteGroup } from '../@types/favorites';
import { Slot } from '../@types/hotkeys';
import { Project, WorkspaceGroup } from '../@types/workspaces';

import * as commands from '../common/commands';
import * as dialogs from '../common/dialogs';
import * as files from '../common/files';
import * as states from '../common/states';

//	Variables __________________________________________________________________

type Backup = {
	favorites:Favorite[],
	favoriteGroups:FavoriteGroup[],
	projects:Project[],
	workspaceGroups:WorkspaceGroup[],
	slots:Slot[],
};

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function activate (context:vscode.ExtensionContext) {
	
	const dirname = path.join(context.globalStorageUri.fsPath, 'backups');
	
	commands.register(context, {
		'l13Projects.action.developer.backup': () => {
			
			createBackup(context, dirname, `${formatDate(new Date())}.json`);
			
		},
		
		'l13Projects.action.developer.remove': async () => {
			
			const item = await selectBackup(dirname);
			
			if (item) fs.unlinkSync(path.join(dirname, item.label));
			
		},
		
		'l13Projects.action.developer.restore': async () => {
			
			const item = await selectBackup(dirname);
			
			if (item) {
				const content = <Backup>JSON.parse(fs.readFileSync(path.join(dirname, item.label), 'utf-8'));
				
				states.updateFavorites(context, content.favorites);
				states.updateFavoriteGroups(context, content.favoriteGroups);
				states.updateProjects(context, content.projects);
				states.updateWorkspaceGroups(context, content.workspaceGroups);
				states.updateSlots(context, content.slots);
				
				showMessageReload(`Restored backup "${item.label}"`);
			}
			
		},
		
		'l13Projects.action.developer.clear': async () => {
			
			if (!await dialogs.confirm('Delete all global states?', 'Ok')) return;
			if (!await dialogs.confirm('Are you sure?', 'Ok')) return;
			
			createBackup(context, dirname, `${formatDate(new Date())}-auto.json`);
			
			states.updateSlots(context, undefined);
			states.updateFavorites(context, undefined);
			states.updateFavoriteGroups(context, undefined);
			states.updateProjects(context, undefined);
			states.updateWorkspaceGroups(context, undefined);
			
			states.updateCurrentWorkspace(context, undefined);
			
			states.updateGroupSimpleStates(context, undefined);
			states.updateGroupTypeStates(context, undefined);
			
			states.updateWorkspacesCache(context, undefined);
			states.updateGitCache(context, undefined);
			states.updateVSCodeCache(context, undefined);
			states.updateVSCodeWorkspaceCache(context, undefined);
			states.updateSubfolderCache(context, undefined);
			
			showMessageReload('Cleared global state');
			
		},
	});

}

//	Functions __________________________________________________________________

async function createBackup (context:vscode.ExtensionContext, dirname:string, basename:string) {
	
	if (!fs.existsSync(dirname)) fs.mkdirSync(dirname, { recursive: true });
	
	const filename = path.join(dirname, basename);
			
	const content:Backup = {
		favorites: states.getFavorites(context),
		favoriteGroups: states.getFavoriteGroups(context),
		projects: states.getProjects(context),
		workspaceGroups: states.getWorkspaceGroups(context),
		slots: states.getSlots(context),
	};
	
	fs.writeFileSync(filename, JSON.stringify(content, null, '\t'), 'utf-8');
	
	const value = await vscode.window.showInformationMessage(`Created file "${basename}"`, 'Go to File');
	
	if (value) files.reveal(filename);
	
}

async function selectBackup (dirname:string) {
	
	if (!fs.existsSync(dirname)) {
		vscode.window.showInformationMessage(`No backups available`);
		return;
	}
	
	const filenames = fs.readdirSync(dirname);
	const items = filenames.map((label) => ({ label }));
	
	if (!items.length) {
		vscode.window.showInformationMessage(`No backups available`);
		return;
	}
	
	return await vscode.window.showQuickPick(items, {
		placeHolder: 'Please select a backup to restore',
	});
	
}

function formatDate (date:Date) {
	
	return `${date.getFullYear()}-${formatDigit(date.getMonth() + 1)}-${formatDigit(date.getDate())}-${formatDigit(date.getHours())}-${formatDigit(date.getMinutes())}-${formatDigit(date.getSeconds())}`;
	
}

function formatDigit (digit:number) {
	
	return `${digit}`.padStart(2, '0');
	
}

async function showMessageReload (text:string) {
	
	const reload = await vscode.window.showInformationMessage(text, 'Reload Window');
	
	if (reload) vscode.commands.executeCommand('workbench.action.reloadWindow');
	
}