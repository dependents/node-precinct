import fs = require("node:fs");
const { b } = require("./b.cjs");
const c: number = b;
module.exports = { c };
