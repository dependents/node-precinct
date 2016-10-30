#!/usr/bin/env node

'use strict';

var precinct = require('../');
var program = require('commander');
var fs = require('fs');

program
  .version(require('../package.json').version)
  .usage('[options] <filename>')
  .option('--es6-mixedImports')
  .parse(process.argv);

var content = fs.readFileSync(program.args[0], 'utf8');

var options = {
  es6: {}
};

if (program['es6MixedImports']) {
  options.es6.mixedImports = true;
}

console.log(precinct(content, options));
