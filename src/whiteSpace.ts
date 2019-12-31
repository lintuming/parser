export const lineBreak = /\r\n?|\n|\u2028|\u2029/;
export const lineBreakGlobal = new RegExp(lineBreak.source, "g");

export const nonASCIIwhitespace = /[\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff]/;
