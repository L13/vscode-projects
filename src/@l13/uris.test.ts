//	Imports ____________________________________________________________________

import * as assert from 'assert';

import { isUri } from './uris';

//	Variables __________________________________________________________________

export type Test = {
	desc: string,
	expect: any,
	toBe: any,
};

//	Initialize _________________________________________________________________

describe('uris', () => {
	
	describe(`.${isUri.name}()`, () => {
		
		function runTests (tests: Test[]) {
			
			for (const test of tests) {
				it(test.desc, () => assert.strictEqual(isUri(test.expect), test.toBe));
			}
			
		}
		
		describe('local paths', () => {
			
			runTests([
				{
					desc: 'absolute windows path with lower case drive letter',
					expect: 'c:\\folder',
					toBe: false,
				},
				{
					desc: 'absolute windows path with upper case drive letter',
					expect: 'C:\\folder',
					toBe: false,
				},
				// {
				// 	desc: 'relative windows path with lower case drive letter',
				// 	expect: 'c:folder',
				// 	toBe: false,
				// },
				// {
				// 	desc: 'relative windows path with upper case drive letter',
				// 	expect: 'C:folder',
				// 	toBe: false,
				// },
				{
					desc: 'absolute windows path without drive letter',
					expect: '\\folder',
					toBe: false,
				},
				{
					desc: 'relative windows path without drive letter',
					expect: '..\\folder',
					toBe: false,
				},
				{
					desc: 'unc windows path',
					expect: '\\\\server\\folder',
					toBe: false,
				},
				{
					desc: 'absolute posix path',
					expect: '/folder',
					toBe: false,
				},
				{
					desc: 'relative posix path to parent folder',
					expect: '../folder',
					toBe: false,
				},
				{
					desc: 'relative posix path from current folder',
					expect: './folder',
					toBe: false,
				},
			]);
			
		});
		
		describe('uris', () => {
			
			runTests([
				{
					desc: 'untitled workspace',
					expect: 'untitled:1234567890',
					toBe: true,
				},
				{
					desc: 'posix file uri',
					expect: 'file:///folder',
					toBe: true,
				},
				{
					desc: 'windows file uri',
					expect: 'file:///c:/folder',
					toBe: true,
				},
				{
					desc: 'virtual file system',
					expect: 'vscode-vfs://github/user/repository-name',
					toBe: true,
				},
				{
					desc: 'remote file system',
					expect: 'vscode-remote://ssh-remote+server/folder',
					toBe: true,
				},
			]);
			
		});
		
	});
	
});

//	Exports ____________________________________________________________________



//	Functions __________________________________________________________________

