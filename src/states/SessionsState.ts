//	Imports ____________________________________________________________________

import * as vscode from 'vscode';

import type { NextSession } from '../@types/sessions';

import * as states from '../common/states';

//	Variables __________________________________________________________________



//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export class SessionsState {
	
	private static current: SessionsState = null;
	
	public static create (context: vscode.ExtensionContext) {
		
		return SessionsState.current || (SessionsState.current = new SessionsState(context));
		
	}
	
	private constructor (private readonly context: vscode.ExtensionContext) {}
	
	public current () {
		
		return states.getNextSession(this.context);
		
	}
	
	public next (session: NextSession) {
		
		states.updateNextSession(this.context, session);
		
	}
	
	public clear () {
		
		this.next(undefined);
		
	}
	
}

//	Functions __________________________________________________________________

