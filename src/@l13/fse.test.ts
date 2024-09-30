/* eslint-disable @typescript-eslint/naming-convention */
//	Imports ____________________________________________________________________

import * as assert from 'assert';

import { createFindGlob } from './fse';

//	Variables __________________________________________________________________

const changeCharacters = {
	'*': '.*', // 42
	'?': '.', // 63
};

const escapeCharacters = {
	'!': '\\!', // 33
	'$': '\\$', // 36
	'(': '\\(', // 40
	')': '\\)', // 41
	'+': '\\+', // 43
	',': '\\,', // 44
	'-': '\\-', // 45
	'.': '\\.', // 46
	':': '\\:', // 58
	'=': '\\=', // 61
	'[': '\\[', // 91
	'\\': '\\\\', // 92
	']': '\\]', // 93
	'^': '\\^', // 94
	'{': '\\{', // 123
	'|': '\\|', // 124
	'}': '\\}', // 125
};

const fixCharacters = {
	'\n': '\\n',
	'\r': '\\r',
	'/': '\\/',
};

type Test = {
	desc?: string,
	expect: any,
	toBe: any,
};

//	Initialize _________________________________________________________________

describe('fse', () => {
	
	describe(`.${createFindGlob.name}()`, () => {
		
		function runTest (test: Test) {
			
			it(test.desc || test.expect, () => assert.strictEqual(`${createFindGlob(test.expect)}`, test.toBe));
			
		}
		
		function runTests (tests: Test[]) {
			
			for (const test of tests) {
				it(test.desc || test.expect, () => assert.strictEqual(`${createFindGlob([test.expect])}`, test.toBe));
			}
			
		}
		
		describe('changed characters', () => {
			
			runTests(Object.entries(changeCharacters).map(([char, result]) => {
				
				return {
					expect: char,
					toBe: `/^(${result})$/`,
				};
				
			}));
			
		});
		
		describe('concat changed characters', () => {
			
			const chars: string[] = [];
			const results: string[] = [];
			
			Object.entries(changeCharacters).forEach(([char, result]) => {
				
				chars.push(char);
				results.push(result);
				
			});
			
			runTest({
				desc: 'changed characters',
				expect: chars,
				toBe: `/^(${results.join('|')})$/`,
			});
			
		});
		
		describe('escaped characters', () => {
			
			runTests(Object.entries(escapeCharacters).map(([char, result]) => {
				
				return {
					expect: char,
					toBe: `/^(${result})$/`,
				};
				
			}));
			
		});
		
		describe('concat escaped characters', () => {
			
			const chars: string[] = [];
			const results: string[] = [];
			
			Object.entries(escapeCharacters).forEach(([char, result]) => {
				
				chars.push(char);
				results.push(result);
				
			});
			
			runTest({
				desc: 'escaped characters',
				expect: chars,
				toBe: `/^(${results.join('|')})$/`,
			});
			
		});
		
		describe('fixed characters', () => {
			
			runTests(Object.entries(fixCharacters).map(([char, result]) => {
				
				return {
					expect: char,
					toBe: `/^(${result})$/`,
				};
				
			}));
			
		});
		
		describe('concat fixed characters', () => {
			
			const chars: string[] = [];
			const results: string[] = [];
			
			Object.entries(fixCharacters).forEach(([char, result]) => {
				
				chars.push(char);
				results.push(result);
				
			});
			
			runTest({
				desc: 'fixed characters',
				expect: chars,
				toBe: `/^(${results.join('|')})$/`,
			});
			
		});
		
		describe('non escaped characters', () => {
			
			const tests: Test[] = [];
			const ignoreCharacters = [
				...Object.keys(changeCharacters),
				...Object.keys(escapeCharacters),
				...Object.keys(fixCharacters),
			];
			
			for (let i = 0; i < 256; i++) {
				const char = String.fromCharCode(i);
				if (!ignoreCharacters.includes(char)) {
					tests.push({
						expect: char,
						toBe: `/^(${char})$/`,
					});
				}
			}
			
			runTests(tests);
			
		});
		
		describe('concat non escaped characters', () => {
			
			const chars: string[] = [];
			const ignoreCharacters = [
				...Object.keys(changeCharacters),
				...Object.keys(escapeCharacters),
				...Object.keys(fixCharacters),
			];
			
			for (let i = 0; i < 256; i++) {
				const char = String.fromCharCode(i);
				if (!ignoreCharacters.includes(char)) chars.push(char);
			}
			
			runTest({
				desc: 'all characters',
				expect: chars,
				toBe: `/^(${chars.join('|')})$/`,
			});
			
		});
		
	});
	
});

//	Exports ____________________________________________________________________



//	Functions __________________________________________________________________

