import Parser from "./state";
import { lineBreakGlobal } from "./whiteSpace";
class Position {
  line: number;
  column: number;
  constructor(line: number, column: number) {
    this.line = line;
    this.column = column;
  }
  offset(n: number) {
    return new Position(this.line, this.column + n);
  }
}

class SourceLocation {
  parser: Parser;
  start: Position | null;
  end: Position | null;
  constructor(p: Parser, startLoc: Position | null, endLoc: Position | null) {
    this.parser = p;
    this.start = startLoc;
    this.end = endLoc;
  }
}

function getLineInfo(input: string, offset: number) {
  let line = 1,
    cur = 0;
  while (true) {
    lineBreakGlobal.lastIndex = cur;
    const match = lineBreakGlobal.exec(input);
    if (match && match.index < offset) {
      line++;
      cur = match.index + match[0].length;
    } else {
      return new Position(line, offset - cur);
    }
  }
}

export { SourceLocation, Position, getLineInfo };
