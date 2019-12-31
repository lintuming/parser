import {
  tokenTypes as t,
  TokenType,
  keywords as keywordToks
} from "./tokenTypes";
import { Position, getLineInfo } from "./location";
import {
  TokenContext,
  initialContext,
  updateContext,
  curContext
} from "./tokenContext";
import { nonASCIIwhitespace, lineBreakGlobal } from "./whiteSpace";
import { ParseSyntaxError } from "./error";
import { isIdentifierStart, isIdentifierCont, keywords } from "./identifier";
import { keywordRegExp } from "./util";
import {
  skipLineComment,
  skipBlockComment,
  fullCharCodeAtPosition,
  finishToken,
  readWordImpl,
  readWord,
  skipSpace,
  readToken,
  readHexChar,
  readInt,
  readCodePoint,
  nextToken,
  getTokenFromCode,
  readNumber,
  readToken_dot,
  readRadixNumber,
  readEscapeString,
  readString,
  readRegexp,
  readToken_slash,
  finishOp
} from "./tokenize";

export type ParserOptions = {
  locations?: boolean;
  ecmaVersion: number;
  sourceType: "module" | "script";
  onComment?: (
    block: boolean,
    text: string,
    start: number,
    end: number,
    startLoc?: Position,
    endLoc?: Position
  ) => any;
};

class Parser {
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
  value?: any;
  kws: RegExp;
  strict: boolean;
  containEsc: boolean;
  constructor(input: string, options: ParserOptions) {
    this.input = input;
    this.options = options;
    this.pos = this.lineStart = 0;
    this.kws = keywordRegExp(
      keywords[
        options.ecmaVersion >= 6
          ? 6
          : options.sourceType === "module"
          ? "5module"
          : 5
      ]
    );
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
    this.containEsc = false;
    this.strict = this.options.sourceType === "module";
  }

  //context
  initialContext = initialContext;
  updateContext = updateContext;
  curContext = curContext;
  //Tokenize
  skipLineComment = skipLineComment;
  skipBlockComment = skipBlockComment;
  skipSpace = skipSpace;

  fullCharCodeAtPosition = fullCharCodeAtPosition;

  finishToken = finishToken;
  nextToken = nextToken;
  getTokenFromCode = getTokenFromCode;

  readWord = readWord;
  readWordImpl = readWordImpl;
  readToken = readToken;
  readHexChar = readHexChar;
  readInt = readInt;
  readCodePoint = readCodePoint;
  readNumber = readNumber;
  readToken_dot = readToken_dot;
  readRadixNumber = readRadixNumber;
  readEscapeString = readEscapeString;
  readString = readString;
  readToken_slash = readToken_slash;
  readRegexp = readRegexp;
  finishOp = finishOp;
  charCodeAt(pos = this.pos) {
    return this.input.charCodeAt(pos);
  }
  //Position
  curPosition() {
    return new Position(this.curLine, this.pos - this.lineStart);
  }
  raiseError(pos: number, msg: string): never {
    const loc = getLineInfo(this.input, pos);
    msg += `(${loc.line}:${loc.column})`;
    const e = new ParseSyntaxError(msg, pos, loc, this.pos);
    throw e;
  }
  unexpected(pos?: number) {
    return this.raiseError(pos != null ? pos : this.start, "Unexpected Token");
  }
}

export default Parser;
