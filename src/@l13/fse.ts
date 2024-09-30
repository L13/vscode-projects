//	Imports ____________________________________________________________________

import { isWindows } from './platforms';

//	Variables __________________________________________________________________

const findRegExpChars = /([!$(-.:=?[-^{|}])/g;

// eslint-disable-next-line no-control-regex
const findIllegalAndControlChars = /[\x00-\x1f"*<>?|\x80-\x9f]/g;

/*
	valid uri chars

	21    23 24 25 26 27 28 29 2A 2B 2C 2D 2E 2F
	!     #  $  %  &  '  (  )  *  +  ,  -  .  /

	30 31 32 33 34 35 36 37 38 39
	0  1  2  3  4  5  6  7  8  9

	3A 3B    3D    3F 40
	:  ;     =     ?  @

	41 42 43 44 45 46 47 48 49 4A 4B 4C 4D 4E 4F 50 51 52 53 54 55 56 57 58 59 5A
	A  B  C  D  E  F  G  H  I  J  K  L  M  N  O  P  Q  R  S  T  U  V  W  X  Y  Z

	5B    5D    5F
	[     ]     _

	61 62 63 64 65 66 67 68 69 6A 6B 6C 6D 6E 6F 70 71 72 73 74 75 76 77 78 79 7A
	a  b  c  d  e  f  g  h  i  j  k  l  m  n  o  p  q  r  s  t  u  v  w  x  y  z

	7E
	~
*/
const findNonUriChars = /[\^!\x23-\x3B=\x3F-\x5B\]_\x61-\x7A~]+/g;
const findColon = /:/g;

//	Initialize _________________________________________________________________



//	Exports ____________________________________________________________________

export function createFindGlob (ignore: string[]) {
	
	return new RegExp(`^(${ignore.map((value) => escapeForRegExp(value)).join('|')})$`);
	
}

export function sanitizePath (pathname: string) {
	
	let name = `${pathname}`.replace(findIllegalAndControlChars, '');
	
	if (!isWindows) name = name.replace(findColon, '');
	
	return name;
	
}

export function sanitizeUri (pathname: string) {
	
	return `${pathname}`.replace(findNonUriChars, '');
	
}

//	Functions __________________________________________________________________

function escapeForRegExp (text: any): string {
	
	return `${text}`.replace(findRegExpChars, (match) => {
		
		if (match === '*') return '.*';
		if (match === '?') return '.';
		
		return `\\${match}`;
		
	});
	
}