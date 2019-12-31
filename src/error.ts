import { Position } from "./location";

class ParseSyntaxError extends SyntaxError {
  pos: number;
  raisedAt: number;
  loc: Position;
  constructor(msg: string, pos: number, loc: Position, raisedAt: number) {
    super(msg);
    this.loc = loc;
    this.pos = pos;
    this.raisedAt = raisedAt;
  }
}


export { ParseSyntaxError };
