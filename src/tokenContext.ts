import Parser from "./state";

class TokenContext {
  token: string;
  isExpr: boolean;
  preserveSpace?: boolean;
  override?: (p: Parser) => any;
  constructor(
    token: string,
    isExpr: boolean,
    preserveSpace?: boolean,
    override?: (p: Parser) => any
  ) {
    this.token = token;
    this.isExpr = isExpr;
    this.preserveSpace = preserveSpace;
    this.override = override;
  }
}

const ContextTypes = {
  blockStatement: new TokenContext("{", false),
  blockExpression: new TokenContext("{", true),
  parenExpression: new TokenContext("(", true),
  parenStatement: new TokenContext("(", false),
  functionExpression: new TokenContext("function", true),
  quoteTemplate: new TokenContext("`", true, true, p => p.readTmplToken()),
  quoteBlock: new TokenContext("${", true)
};

class Context {
  initialContext() {
    return [ContextTypes.blockStatement];
  }
}

export { ContextTypes, TokenContext, Context };
