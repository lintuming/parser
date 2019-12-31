import { tokenTypes as t, TokenType } from "./tokenTypes";
import { Position, getLineInfo } from "./location";
import { TokenContext, Context } from "./tokenContext";
import { nonASCIIwhitespace, lineBreakGlobal } from "./whiteSpace";
import { ParseSyntaxError } from "./error";

export type ParserOptions = {
  locations?: boolean;
  onComment?: (
    block: boolean,
    text: string,
    start: number,
    end: number,
    startLoc?: Position,
    endLoc?: Position
  ) => any;
};

class Parser extends Context {
  input: string;
  options: ParserOptions;
  pos: number;
  lineStart: number;
  curLine: number;
  type: TokenType;
  start: number;
  end: number;
  startLoc: Position | null;
  endLoc: Position | null;
  lastTokStart: number;
  lastTokEnd: number;
  lastTokStartLoc: Position | null;
  lastTokEndLoc: Position | null;
  context: TokenContext[];
  exprAllowed: boolean;
  inFunction: boolean;
  inGenerator: boolean;
  labels: Array<string>;
  value: null;
  constructor(input: string, options: ParserOptions) {
    super();
    this.input = input;
    this.options = options;
    this.pos = this.lineStart = 0;
    this.curLine = 1;
    this.type = t.eof;
    this.start = this.end = this.pos;
    this.startLoc = this.endLoc = null;
    this.lastTokStart = this.lastTokEnd = this.pos;
    this.lastTokStartLoc = this.lastTokEndLoc = null;
    this.context = this.initialContext();
    this.exprAllowed = true;
    this.inFunction = this.inGenerator = false;
    this.labels = [];
    this.value = null;
  }
  charCodeAt(pos = this.pos) {
    return this.input.charCodeAt(pos);
  }

  //Tokenize
  skipSpace() {
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
      } else if (
        cc >= 5760 &&
        nonASCIIwhitespace.test(String.fromCharCode(cc))
      ) {
        ++this.pos;
      } else {
        break;
      }
    }
  }
  curContext() {
    return this.context[this.context.length - 1];
  }
  nextToken() {
    let curContext = this.curContext();
    if (!curContext || !curContext.preserveSpace) this.skipSpace();
    this.start = this.pos;
    if (this.options.locations) {
      this.startLoc = this.curPosition();
    }
    if (this.pos >= this.input.length) return this.finishToken(tt.eof);
    if (curContext.override) return curContext.override(this);
    else {
      return this.readToken()
    }
  }
  skipBlockComment() {
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
  skipLineComment(skip: number) {
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

  //Position
  curPosition() {
    return new Position(this.curLine, this.pos - this.lineStart);
  }
  raiseError(pos: number, msg: string) {
    const loc = getLineInfo(this.input, pos);
    msg += `(${loc.line}:${loc.column})`;
    const e = new ParseSyntaxError(msg, pos, loc, this.pos);
    throw e;
  }
}

export default Parser;
