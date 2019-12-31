const beforeExpr = true;
const startsExpr = true;
const isAssign = true;
const isLoop = true;
const postfix = true;
const prefix = true;

type Config = {
  keyword?: string;
  beforeExpr?: boolean;
  startsExpr?: boolean;
  isLoop?: boolean;
  isAssign?: boolean;
  prefix?: boolean;
  postfix?: boolean;
  binop?: number;
};
class TokenType {
  label: string;
  keyword?: string;
  beforeExpr: boolean;
  startsExpr: boolean;
  isLoop: boolean;
  isAssign: boolean;
  prefix: boolean;
  postfix: boolean;
  binop: number | null;
  updateContext: Function | null;
  constructor(label: string, conf: Config = {}) {
    this.label = label;
    this.keyword = conf.keyword;
    this.beforeExpr = !!conf.beforeExpr;
    this.startsExpr = !!conf.startsExpr;
    this.isLoop = !!conf.isLoop;
    this.isAssign = !!conf.isAssign;
    this.prefix = !!conf.prefix;
    this.postfix = !!conf.postfix;
    this.binop = conf.binop || null;
    this.updateContext = null;
  }
}
function binaryOperator(
  name: string,
  precedence: number,
  options: Config = {}
) {
  return new TokenType(name, { beforeExpr, binop: precedence, ...options });
}

export const keywords = new Map();

function keyword(name: string, options: Config = {}) {
  options.keyword = name;
  const token = new TokenType(name, options);
  keywords.set(name, token);
  return token;
}
// The `beforeExpr` property is used to disambiguate between regular
// expressions and divisions. It is set on all token types that can
// be followed by an expression (thus, a slash after them would be a
// regular expression).
//
// The `startsExpr` property is used to determine whether an expression
// may be the “argument” subexpression of a `yield` expression or
// `yield` statement. It is set on all token types that may be at the
// start of a subexpression.
//

const tokenTypes = {
  eof: new TokenType("eof"),
  regexp: new TokenType("regexp", {
    startsExpr
  }),

  bracketL: new TokenType("[", {
    startsExpr,
    beforeExpr
  }),
  bracketR: new TokenType("]"),
  parenL: new TokenType("(", {
    startsExpr,
    beforeExpr
  }),
  parenR: new TokenType(")"),
  braceL: new TokenType("{", { startsExpr, beforeExpr }),
  braceR: new TokenType("}", { startsExpr, beforeExpr }),
  colon: new TokenType(":", { beforeExpr }),
  semi: new TokenType(";", { beforeExpr }),
  comma: new TokenType(",", { beforeExpr }),
  dot: new TokenType("."),
  question: new TokenType("?", { beforeExpr }),
  arrow: new TokenType("=>", { beforeExpr }),
  eclipse: new TokenType("...", { beforeExpr }),
  backQuote: new TokenType("`", { startsExpr }),
  dollarBraceL: new TokenType("${", { startsExpr, beforeExpr }),
  // Operators. These carry several kinds of properties to help the
  // parser use them properly (the presence of these properties is
  // what categorizes them as operators).
  //
  // `binop`, when present, specifies that this operator is a binary
  // operator, and will refer to its precedence.
  //
  // `prefix` and `postfix` mark the operator as a prefix or postfix
  // unary operator.
  //
  // `isAssign` marks all of `=`, `+=`, `-=` etcetera, which act as
  // binary operators with a very low precedence, that should result
  // in AssignmentExpression nodes.
  eq: new TokenType("=", { isAssign, beforeExpr }),
  assign: new TokenType("_=", { isAssign, beforeExpr }),
  incDec: new TokenType("++/--", { prefix, startsExpr, postfix }),
  prefix: new TokenType("prefix", { beforeExpr, prefix, startsExpr }),
  nullishCoalescing: binaryOperator("??", 0),
  logicalOr: binaryOperator("||", 1),
  logicalAnd: binaryOperator("&&", 2),
  bitWiseOr: binaryOperator("|", 3),
  bitWiseXor: binaryOperator("^", 4),
  bitWiseAnd: binaryOperator("&", 5),
  equality: binaryOperator("==/!=/===/!==", 6),
  relational: binaryOperator(">/>=/</<=", 7),
  bitShift: binaryOperator(">>/<</>>>", 8),
  plusMin: binaryOperator("+/-", 9, { prefix, startsExpr }),
  modulo: binaryOperator("%", 10),
  star: binaryOperator("*", 10),
  slash: binaryOperator("/", 10),

  //keywords
  _break: keyword("break"),
  _case: keyword("case", { beforeExpr }),
  _catch: keyword("catch"),
  _continue: keyword("continue"),
  _default: keyword("default", { beforeExpr }),
  _do: keyword("do", {
    isLoop
  }),
  // example:if(){}else return 1
  _else: keyword("else", { beforeExpr }),
  _finally: keyword("finally"),
  _for: keyword("for", {
    isLoop
  }),
  //example: yield function xxx(){}
  _function: keyword("function", { startsExpr }),
  _if: keyword("if"),
  _return: keyword("return", { beforeExpr }),
  _switch: keyword("switch"),
  _throw: keyword("throw", { beforeExpr }),
  _try: keyword("try"),
  _var: keyword("var"),
  _let: keyword("let"),
  _const: keyword("const"),
  _while: keyword("while", { isLoop }),
  _with: keyword("with"),
  _new: keyword("new", { startsExpr, beforeExpr }),
  _this: keyword("this", { startsExpr }),
  _super: keyword("super", { startsExpr }),
  _class: keyword("class", { startsExpr }),
  _extends: keyword("extends", { beforeExpr }),
  _export: keyword("export"),
  _import: keyword("import"),
  _null: keyword("null", { startsExpr }),
  _yield: keyword("yield", { beforeExpr, startsExpr }),
  _true: keyword("true", { startsExpr }),
  _false: keyword("false", { startsExpr }),
  _in: keyword("in", { beforeExpr, binop: 7 }),
  _instanceof: keyword("instanceof", { beforeExpr, binop: 7 }),
  _typeof: keyword("typeof", { beforeExpr, prefix, startsExpr }),
  _void: keyword("void", { beforeExpr, prefix, startsExpr }),
  _delete: keyword("delete", { beforeExpr, prefix, startsExpr })
};

export { tokenTypes, TokenType };
