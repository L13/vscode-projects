//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class Output {
	
	public static current: Output = null;
	
	public static create () {
		
		return Output.current || (Output.current = new Output());
		
	}
	
	private outputChannel: vscode.OutputChannel = null;
	
	public constructor () {
		
		this.outputChannel = vscode.window.createOutputChannel('Projects');
		
		Output.current = this;
		
	}
	
	public log (text: string) {
		
		this.message(`[${createTimestamp()}] ${text}`);
		
	}
	
	public message (line = '') {
		
		this.outputChannel.appendLine(line);
		
	}
	
	public show () {
		
		this.outputChannel.show();
		
	}
	
	public hide () {
		
		this.outputChannel.hide();
		
	}
	
	public clear () {
		
		this.outputChannel.clear();
		
	}
	
	public dispose () {
		
		if (Output.current) {
			Output.current.clear(); // Fixes uncleared output panel
			Output.current.dispose();
			Output.current = undefined;
		}
		
	}
	
}

//	Functions __________________________________________________________________

function createTimestamp () {
	
	const now = new Date();
	const hours = `${now.getHours()}`.padStart(2, '0');
	const minutes = `${now.getMinutes()}`.padStart(2, '0');
	const seconds = `${now.getSeconds()}`.padStart(2, '0');
	
	return `${hours}:${minutes}:${seconds}`;
	
}