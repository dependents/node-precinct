#!/usr/bin/env node

'use strict';

var precinct = require('../');
var program = require('commander');
var fs = require('fs');

program
  .version(require('../package.json').version)
  .usage('[options] <filename>')
  .parse(process.argv);

var content = fs.readFileSync(program.args[0], 'utf8');
console.log(precinct(content));
