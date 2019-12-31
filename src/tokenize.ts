import Parser from "./state";
import { SourceLocation } from "./location";
import {
  tokenTypes as t,
  TokenType,
  keywords as keywordToks
} from "./tokenTypes";
import { isIdentifierStart, isIdentifierCont, keywords } from "./identifier";
import { nonASCIIwhitespace, lineBreakGlobal } from "./whiteSpace";

function codePointToString(code: number) {
  if (code <= 0xffff) return String.fromCharCode(code);
  else
    return String.fromCharCode(
      Math.floor((code - 0x10000) / 0x400) + 0xd800,
      ((code - 0x10000) % 0x400) + 0xdc00
    );
}
class Token {
  type: TokenType;
  start: number;
  end: number;
  value: any;
  loc?: SourceLocation;
  constructor(p: Parser) {
    this.type = p.type;
    this.start = p.start;
    this.end = p.end;
    this.value = p.value;
    if (p.options.locations) {
      this.loc = new SourceLocation(p, p.startLoc, p.endLoc);
    }
  }
}

function skipSpace(this: Parser) {
  while (this.pos < this.input.length) {
    const cc = this.charCodeAt();
    //" "
    if (cc === 32) {
      ++this.pos;
    } else if (cc === 13) {
      ++this.pos;
      const next = this.charCodeAt();
      if (next === 10) {
        ++this.pos;
      }
      if (this.options.locations) {
        this.curLine++;
        this.lineStart = this.pos;
      }
    } else if ([10, 8232, 8233].some(c => cc === c)) {
      ++this.pos;
      if (this.options.locations) {
        this.curLine++;
        this.lineStart = this.pos;
      }
    } else if (cc > 8 && cc < 14) {
      ++this.pos;
    } else if (cc === 47) {
      // "/"
      const next = this.charCodeAt(this.pos + 1);
      if (next === 42) {
        // "*"
        this.skipBlockComment();
      } else if (next === 47) {
        // "/"
        this.skipLineComment(2);
      } else {
        break;
      }
    } else if (cc === 160) {
      ++this.pos;
    } else if (cc >= 5760 && nonASCIIwhitespace.test(String.fromCharCode(cc))) {
      ++this.pos;
    } else {
      break;
    }
  }
}

function skipBlockComment(this: Parser) {
  const startLoc = this.options.locations ? this.curPosition() : undefined;
  const start = this.pos,
    end = this.input.indexOf("*/", (this.pos += 2));
  if (end === -1) {
    this.raiseError(this.pos - 2, "Unterminated comment");
  }
  this.pos = end + 2;
  if (this.options.locations) {
    lineBreakGlobal.lastIndex = start;
    let match;
    while (
      (match = lineBreakGlobal.exec(this.input)) &&
      match.index < this.pos
    ) {
      ++this.curLine;
      this.lineStart = match.index + match[0].length;
    }
  }
  if (this.options.onComment) {
    this.options.onComment(
      true,
      this.input.slice(start + 2, end),
      start,
      this.pos,
      startLoc,
      this.options.locations ? this.curPosition() : undefined
    );
  }
}
function skipLineComment(this: Parser, skip: number) {
  const start = this.pos;
  const startLoc = this.options.locations ? this.curPosition() : undefined;
  this.pos += skip;
  while (
    this.pos < this.input.length &&
    [10, 13, 8232, 8233].some(code => code !== this.charCodeAt(this.pos))
  ) {
    this.pos++;
  }
  if (this.options.onComment) {
    this.options.onComment(
      false,
      this.input.slice(start + skip, this.pos),
      start,
      this.pos,
      startLoc,
      this.options.locations ? this.curPosition() : undefined
    );
  }
}

function nextToken(this: Parser) {
  let curContext = this.curContext();
  if (!curContext || !curContext.preserveSpace) this.skipSpace();
  this.start = this.pos;
  if (this.options.locations) {
    this.startLoc = this.curPosition();
  }
  if (this.pos >= this.input.length) return this.finishToken(t.eof);
  if (curContext.override) return curContext.override(this);
  else {
    return this.readToken(this.fullCharCodeAtPosition());
  }
}
function finishToken(this: Parser, type: TokenType, value?: any) {
  this.end = this.pos;
  if (this.options.locations) this.endLoc = this.curPosition();
  let prevType = this.type;
  this.type = type;
  this.value = value;
  this.updateContext(prevType);
}
function fullCharCodeAtPosition(this: Parser) {
  /**
   * https://mathiasbynens.be/notes/javascript-encoding#surrogate-pairs
   *
   * Surrogate-pairs
   *
   * Characters outside the BMP, e.g. U+1D306 tetragram for centre (𝌆),
   * can only be encoded in UTF-16 using two 16-bit code units: 0xD834 0xDF06.
   * This is called a surrogate pair.
   *
   * The first code unit of a surrogate pair is always in the range from `0xD800` to `0xDBFF`,
   * and is called a high surrogate or a lead surrogate.
   *
   * The second code unit of a surrogate pair is always in the range from `0xDC00` to `0xDFFF`,
   * and is called a low surrogate or a trail surrogate.
   *
   * Example:
   * A code point C greater than 0xFFFF corresponds to a surrogate pair <H, L> as per the following formula:
   *
   * H = Math.floor((C - 0x10000) / 0x400) + 0xD800
   * L = (C - 0x10000) % 0x400 + 0xDC00
   *
   * The reverse mapping, i.e. from a surrogate pair <H, L> to a Unicode code point C, is given by:
   *
   * C = (H - 0xD800) * 0x400 + L - 0xDC00 + 0x10000
   *
   * C = H * 0x400 - 0xD800*0x400 + L - 0xDC00 + 0x10000
   *
   * C = H << 10 + L - 0x35fdc00
   *
   * this is WHY acorn use this expression.
   */
  const code = this.charCodeAt();
  if (code < 0xd800 || code > 0xdfff) return code;
  let next = this.charCodeAt(this.pos + 1);
  return (code << 10) + next - 0x35fdc00;
}

function readToken(this: Parser, code: number) {
  // "\uxxxx" is valid identifier start
  if (isIdentifierStart(code, this.options.ecmaVersion >= 6) || code === 92) {
    return this.readWord();
  }
  return this.getTokenFromCode(code);
}
function getTokenFromCode(this: Parser, code: number) {
  switch (code) {
    case 46: // "."
      return this.readToken_dot();
    case 40: // "("
      ++this.pos;
      return this.finishToken(t.parenL);
    case 41: // ")"
      ++this.pos;
      return this.finishToken(t.parenR);
    case 59: // ";"
      ++this.pos;
      return this.finishToken(t.semi);
    case 44: // ","
      ++this.pos;
      return this.finishToken(t.comma);
    case 91: // "["
      ++this.pos;
      return this.finishToken(t.bracketL);
    case 93: // "]"
      ++this.pos;
      return this.finishToken(t.bracketR);
    case 123: // "{"
      ++this.pos;
      return this.finishToken(t.braceL);
    case 125: // "}"
      ++this.pos;
      return this.finishToken(t.braceR);
    case 58: // ":"
      ++this.pos;
      return this.finishToken(t.colon);
    case 63: // "?"
      ++this.pos;
      return this.finishToken(t.question);

    case 96: // "`"
      if (this.options.ecmaVersion < 6) break;
      ++this.pos;
      return this.finishToken(t.backQuote);
    case 48: // "0"
      const next = this.charCodeAt(this.pos + 1);
      // 0x 0X
      if (next === 88 || next === 120) {
        return this.readRadixNumber(16);
      }

      if (this.options.ecmaVersion >= 6) {
        // 0o 0O
        if (next === 111 || next === 79) {
          return this.readRadixNumber(8);
        }
        // 0b 0B
        if (next === 98 || next === 66) {
          return this.readRadixNumber(2);
        }
      }
    case 49:
    case 50:
    case 51:
    case 52:
    case 53:
    case 54:
    case 55:
    case 56:
    case 57: // 1-9
      return this.readNumber(false);
    case 34:
    case 39:
      return this.readString(code);
    default:
      this.raiseError(
        this.pos,
        "Unexpected character '" + codePointToString(code) + "'"
      );
  }
}
function readString(this: Parser, quote: number) {
  let out = "";
  let cc = this.charCodeAt(++this.pos);
  let chunkStart = this.pos;
  while (cc !== quote) {
    if (this.pos >= this.input.length)
      this.raiseError(this.start, "Undetermined string literal");
    // "\" escape
    if (cc === 92) {
      out += this.input.slice(chunkStart, this.pos);
      out += this.readEscapeString();
      
    }
    this.pos++;
    cc = this.charCodeAt();
  }
}
function readRadixNumber(this: Parser, radix: 2 | 8 | 16) {
  let start = this.pos;
  this.pos += 2;
  let val;
  val = this.readInt(radix);
  if (this.options.ecmaVersion >= 6 && this.charCodeAt() === 110) {
    const str = this.input.slice(start, this.pos);
    val = typeof BigInt !== "undefined" ? BigInt(str) : null;
    this.pos++;
  } else if (isIdentifierStart(this.fullCharCodeAtPosition())) {
    this.raiseError(this.pos, "Identifier directly after number");
  }
  return this.finishToken(t.num, val);
}
function readToken_dot(this: Parser) {
  let next = this.charCodeAt(this.pos + 1);
  if (next >= 48 && next <= 57) return this.readNumber(true);
  let nextnext = this.charCodeAt(this.pos + 2);
  if (this.options.ecmaVersion >= 6 && next === 46 && nextnext === 46) {
    this.pos += 3;
    return this.finishToken(t.eclipse);
  } else {
    this.pos++;
    return this.finishToken(t.dot);
  }
}
function readNumber(this: Parser, starsWithDot: boolean) {
  let start = this.pos;
  let val;
  if (!starsWithDot && this.readInt(10) === null) {
    this.raiseError(start, "Invalid number");
  }
  let octal = this.pos - start >= 2 && this.charCodeAt(this.start) === 48;
  if (octal && this.strict) {
    this.raiseError(start, "Invalid number");
  }
  if (
    !octal &&
    !starsWithDot &&
    this.options.ecmaVersion >= 6 &&
    this.charCodeAt() === 110
  ) {
    const str = this.input.slice(start, this.pos);
    val = typeof BigInt !== "undefined" ? BigInt(str) : null;
    this.pos++;
    if (isIdentifierStart(this.fullCharCodeAtPosition()))
      this.raiseError(start, "Identifier directly after number");
    return this.finishToken(t.num, val);
  }
  if (octal && /[89]/.test(this.input.slice(start, this.pos))) octal = false;
  //"."
  if (this.charCodeAt() === 46 && !octal) {
    this.pos++;
    this.readInt(10);
  }
  // "e"
  if (!octal && (this.charCodeAt() === 69 || this.charCodeAt() === 101)) {
    this.pos++;
    if (this.charCodeAt() === 43 || this.charCodeAt() === 45) this.pos++; //"+-"
    if (this.readInt(10) === null) this.raiseError(start, "Invalid number");
  }
  if (isIdentifierStart(this.fullCharCodeAtPosition())) {
    this.raiseError(this.pos, "Identifier directly after number");
  }
  let str = this.input.slice(start, this.pos);
  val = octal ? parseInt(str, 8) : parseFloat(str);
  return this.finishToken(t.num, val);
}
function readWordImpl(this: Parser) {
  this.containEsc = false;
  let word = "",
    first = true,
    astral = this.options.ecmaVersion >= 6,
    chunkStart = this.pos;
  while (this.pos < this.input.length) {
    const cc = this.fullCharCodeAtPosition();
    if (isIdentifierCont(cc, astral)) {
      this.pos += cc <= 0xffff ? 1 : 2;
    } else if (cc === 92) {
      // "\"
      this.containEsc = true;
      word += this.input.slice(chunkStart, this.pos);
      const escStart = this.pos;
      if (this.charCodeAt(++this.pos) !== 117) {
        this.raiseError(this.pos, "Expecting unicode escape sequence \\uxxxx");
      }
      this.pos++;
      const esc = this.readCodePoint();
      if (!(first ? isIdentifierStart : isIdentifierCont)(esc, astral)) {
        this.raiseError(escStart, "Invalid Unicode escape");
      }
      word += codePointToString(esc);
    }
  }
  return word;
}
function readCodePoint(this: Parser) {
  const cc = this.charCodeAt();
  let code;
  if (cc === 123) {
    // “{” '\u{1F4A9}' es6
    if (this.options.ecmaVersion < 6) this.unexpected();
    const codePos = ++this.pos;
    code = this.readHexChar(this.input.indexOf("}", this.pos) - this.pos);
    this.pos++;
    if (code > 0x10ffff) this.raiseError(codePos, "Code point out of bound");
  } else {
    code = this.readHexChar(4);
  }
  return code;
}
//read character escape sequence '\x' '\u' '\U'
function readHexChar(this: Parser, len: number) {
  let codePos = this.pos;
  const cc = this.readInt(16, len);
  if (cc === null) this.raiseError(codePos, "");
  return cc;
}
function readInt(this: Parser, radix: number, len?: number) {
  let total = 0,
    start = this.pos,
    val;
  for (let i = 0, j = len == null ? Infinity : len; i < j; i++) {
    const code = this.charCodeAt();
    // after 0~9
    if (code >= 97) val = code - 97 + 10;
    else if (code >= 65) val = code - 65 + 10;
    else if (code >= 48) val = code - 48;
    else val = Infinity;
    if (val >= radix) break;
    this.pos++;
    total = total * radix + val;
  }
  if (this.pos === start || (len != null && this.pos - start !== len))
    return null;
  return total;
}
function readWord(this: Parser) {
  const word = this.readWordImpl();
  let type = t.name;
  if (this.kws.test(word)) {
    type = keywordToks.get(word);
  }
  return this.finishToken(type, word);
}

export {
  Token,
  skipLineComment,
  skipBlockComment,
  skipSpace,
  readWordImpl,
  readWord,
  readToken,
  readHexChar,
  readInt,
  readCodePoint,
  readNumber,
  readToken_dot,
  readRadixNumber,
  nextToken,
  getTokenFromCode,
  fullCharCodeAtPosition,
  finishToken
};
