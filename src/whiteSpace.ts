export const lineBreak = /\r\n?|\n|\u2028|\u2029/;
export const lineBreakGlobal = new RegExp(lineBreak.source, "g");

export function isNewLine(code: number, ecma2019String?: boolean) {
  return (
    code === 10 ||
    code === 13 ||
    (!ecma2019String && (code === 0x2028 || code === 0x2029))
  );
}
export const nonASCIIwhitespace = /[\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff]/;
