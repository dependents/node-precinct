#!/usr/bin/env node

import fs from 'node:fs';
import { program } from 'commander';
import precinct from '../index.js';
import pkg from '../package.json' with { type: 'json' };

const { name, description, version } = pkg;

program
  .name(name)
  .description(description)
  .version(version)
  .argument('<filename>', 'the path to file to examine')
  .option('--es6-mixed-imports', 'Fetch all dependendies from a file that contains both CJS and ES6 imports')
  .option('-t, --type <type>', 'The type of content being passed in. Useful if you want to use a non-JS detective')
  .showHelpAfterError()
  .parse();

const { es6MixedImports: mixedImports, type } = program.opts();
const options = {
  es6: {
    mixedImports: Boolean(mixedImports)
  },
  type
};

const content = fs.readFileSync(program.args[0], 'utf8');

console.log(precinct(content, options).join('\n'));
