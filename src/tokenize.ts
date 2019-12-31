import Parser from "./state";
import { SourceLocation } from "./location";
import { TokenType } from "./tokenTypes";
class Token {
  type: TokenType;
  start: number;
  end: number;
  value: any;
  loc?: SourceLocation;
  constructor(p:Parser) {
    this.type = p.type;
    this.start = p.start;
    this.end = p.end;
    this.value = p.value;
    if (p.options.locations) {
      this.loc = new SourceLocation(p, p.startLoc, p.endLoc);
    }
  }
}


export { Token };
