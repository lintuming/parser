import Parser from "./state";
import { tokenTypes as t, TokenType } from "./tokenTypes";
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

function initialContext() {
  return [ContextTypes.blockStatement];
}
function updateContext(this: Parser, prevType: TokenType) {
  let update,
    type = this.type;
  //xx.xx
  if (type.keyword && prevType === t.dot) this.exprAllowed = false;
  else if ((update = type.updateContext)) {
    update.call(this, prevType);
  } else {
    this.exprAllowed = type.beforeExpr;
  }
}
function curContext(this: Parser) {
  return this.context[this.context.length - 1];
}
export {
  ContextTypes,
  TokenContext,
  initialContext,
  updateContext,
  curContext
};
