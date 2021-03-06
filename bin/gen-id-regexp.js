"use strict";




let pkg = require("../package.json");
let dependencies = Object.keys(pkg.devDependencies);
let unicodeVersion = dependencies.find(name => /^unicode-\d/.test(name));

let start = require(unicodeVersion +
  "/Binary_Property/ID_Start/code-points.js").filter(ch => ch > 0x7f);

let last = -1;
let cont = [0x200c, 0x200d].concat(
  require(unicodeVersion +
    "/Binary_Property/ID_Continue/code-points.js").filter(
    ch => ch > 0x7f && search(start, ch, last + 1) === -1
  )
);

function search(arr, ch, starting) {
  for (let i = starting; arr[i] <= ch && i < arr.length; last = i++) {
    if (arr[i] === ch) return i;
  }
  return -1;
}
function esc(code) {
  let hex = code.toString(16);
  return hex.length <= 2
    ? "\\x" + hex.padStart(2, "0")
    : "\\u" + hex.padStart(4, "0");
}

function generate(chars) {
  let astral = [],
    re = "";
  for (let i = 0, at = 0x10000; i < chars.length; i++) {
    let from = chars[i],
      to = from;
    while (i < chars.length - 1 && chars[i + 1] === to + 1) {
      i++;
      to++;
    }
    if (to <= 0xffff) {
      if (from === to) re += esc(from);
      else if (from + 1 === to) re += esc(from) + esc(to);
      else re += esc(from) + "-" + esc(to);
    } else {
      astral.push(from - at, to - from);
      at = to;
    }
  }
  return { nonASCII: re, astral: astral };
}

let startData = generate(start),
  contData = generate(cont);


const src = "../src/chars.ts";

const fs = require("fs-extra");
const path = require("path");

let template = fs.readFileSync(path.join(__dirname, "./template"), "utf8");

const replaceRegExp = new RegExp("{{.*}}");

const replaceRegs = [
  "nonASCIIStart",
  "nonASCIICont",
  "astralStart",
  "astralCont"
].map(k => new RegExp(`{{${k}}}`));

const replaceValues = [
  startData.nonASCII,
  contData.nonASCII,
  JSON.stringify(startData.astral),
  JSON.stringify(contData.astral)
];
for (const [k, reg] of replaceRegs.entries()) {
  template = template.replace(reg, replaceValues[k]);
}
fs.writeFileSync(path.join(__dirname, src), template);
