import Parser, { ParserOptions } from "./state";

function parse(input: string, options: ParserOptions) {
  const p = new Parser(input, options);
  p.nextToken();
}
