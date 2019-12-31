/* 
  Unicode basics 
  https://mathiasbynens.be/notes/javascript-unicode#unicode-basics

  It’s easiest to think of Unicode as a database that maps any symbol you can think of to a number called its code point.

  The first plane (U+0000 → U+FFFF) and is called the `Basic Multilingual Plane` or `BMP`, 
  and it’s probably the most important one, as it contains all the most commonly used symbols. 
  Most of the time you don’t need any code points outside of the BMP for text documents in English. 

  That leaves us about 1 million other code points (U+010000 → U+10FFFF) that live outside the BMP. 
  The planes these code points belong to are called supplementary planes, or `astral planes`.
*/

import {
  nonASCIIidentifier,
  nonASCIIidentifierStart,
  astralIdentifierCodes,
  astralIdentifierStartCodes
} from "./chars";

function isInAstralSet(code: number, set: number[]) {
  let from = 0x10000;
  for (let i = 0; i < set.length; i += 2) {
    const start = from + set[i];
    if (start > code) return false;
    const end = start + set[i + 1];
    if (code <= end) return true;
    from = end;
  }
  return false;
}

function isIdentifierStart(code: number, astral: boolean) {
  //In ES2015, identifiers must start with $, _, or any symbol with the Unicode derived core property ID_Start.
  if (code < 65) return code === 36; // "$"
  if (code < 91) return true; //A-Z
  if (code < 97) return code === 95; // "_"
  if (code <= 122) return true; //a-z
  if (code <= 0xffff) {
    // nonASCIIidentifierStart begin at 0xaa
    return (
      code >= 0xaa && nonASCIIidentifierStart.test(String.fromCharCode(code))
    );
  }
  if (astral === false) return false;
  return isInAstralSet(code, astralIdentifierStartCodes);
}

function isIdentifierCont(code: number, astral: boolean) {
  
}
