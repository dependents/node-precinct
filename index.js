import fs from 'node:fs';
import { builtinModules, createRequire } from 'node:module';
import path from 'node:path';
import { debuglog } from 'node:util';
import getModuleType from 'module-definition';
import Walker from 'node-source-walk';
import detectiveAmd from 'detective-amd';
import detectiveCjs from 'detective-cjs';
import detectiveEs6 from 'detective-es6';
import detectiveLess from '@dependents/detective-less';
import detectivePostcss from 'detective-postcss';
import detectiveSass from 'detective-sass';
import detectiveScss from 'detective-scss';
import detectiveStylus from 'detective-stylus';

const require = createRequire(import.meta.url);

const debug = debuglog('precinct');

// The TypeScript and Vue detectives are loaded on demand: they pull in the TypeScript
// compiler and the Vue SFC compiler, which the majority of consumers never need. Both
// are required synchronously via require(ESM), supported on every Node version this
// package supports, so the public API stays synchronous.
let detectiveTypeScript;
let detectiveVue;

// Tagged so callers can tell an unusable peer dependency apart from a file that failed to parse
const typeScriptUnavailableCode = 'ERR_TYPESCRIPT_UNAVAILABLE';

/**
 * Loads a detective that needs the optional `typescript` peer dependency. The load is
 * attempted rather than guarded by a version check, so whatever the peer dependency
 * happens to be, the failure it produces deep inside the detective's own dependencies
 * is rewritten into something the consumer can act on.
 *
 * @param {string} name - Detective package to load
 * @return {any}
 */
function loadTypeScriptDetective(name) {
  debug('loading %s on demand', name);

  try {
    return require(name).default;
  } catch(error) {
    debug('could not load %s: %s', name, error.message);
    const failure = new Error(explainLoadFailure(name, error), { cause: error });
    throw Object.assign(failure, { code: typeScriptUnavailableCode });
  }
}

/**
 * @param {string} name - Detective package that failed to load
 * @param {Error} error
 * @return {string}
 */
function explainLoadFailure(name, error) {
  const version = installedTypeScriptVersion();

  if (!version) {
    return `${name} requires the "typescript" peer dependency, which is not installed. ` +
      'Run `npm install typescript` to analyze TypeScript and Vue files.';
  }

  return `${name} could not be loaded with typescript@${version} installed: ${error.message}`;
}

/**
 * @return {string | undefined}
 */
function installedTypeScriptVersion() {
  try {
    return require('typescript').version;
  } catch {
    return undefined;
  }
}

function loadDetectiveTypeScript() {
  detectiveTypeScript ??= loadTypeScriptDetective('detective-typescript');
  return detectiveTypeScript;
}

function loadDetectiveVue() {
  detectiveVue ??= loadTypeScriptDetective('detective-vue2');
  return detectiveVue;
}

/**
 * @typedef {Record<string, unknown> & {
 *   type?: string,
 *   walker?: Record<string, any>
 * }} PrecinctOptions
 */

/**
 * @typedef {PrecinctOptions & {
 *   includeCore?: boolean,
 *   fileSystem?: { readFileSync: (path: string, encoding: 'utf8') => string }
 * }} PaperworkOptions
 */

/**
 * Finds the list of dependencies for the given file
 *
 * @param {string | Record<string, any>} content - File's content or AST
 * @param {PrecinctOptions} [options]
 * @return {string[]}
 */
function precinct(content, options = {}) {
  debug('options given: %o', options);

  let ast;

  // We assume we're dealing with a JS file
  if (!options.type && typeof content !== 'object') {
    debug('we assume this is JS');
    const walker = new Walker(options.walker);

    try {
      // Parse once and distribute the AST to all detectives
      ast = walker.parse(content);
      debug('parsed the file content into an ast');
      precinct.ast = ast;
    } catch(error) {
      // In case a previous call had it populated
      precinct.ast = null;
      debug('could not parse content: %s', error.message);
      return [];
    }
  // SASS files shouldn't be parsed by Acorn
  } else {
    ast = content;

    if (typeof content === 'object') {
      precinct.ast = content;
    }
  }

  const type = options.type ?? getModuleType.fromSource(ast);
  debug('module type: %s', type);

  const detective = getDetective(type, options);
  let dependencies = [];

  if (detective) {
    dependencies = detective(ast, options[type]);
  } else {
    debug('no detective found for: %s', type);
  }

  // For non-JS files that we don't parse
  if (detective?.ast) {
    precinct.ast = detective.ast;
  }

  return dependencies;
}

/**
 * The last AST produced by precinct, or null when parsing failed
 *
 * @type {Record<string, any> | null}
 */
precinct.ast = null;

/**
 * Returns the dependencies for the given file path
 *
 * @param {string} filename
 * @param {PaperworkOptions} [options]
 * @return {string[]}
 */
function paperwork(filename, options = {}) {
  options = { includeCore: true, ...options };

  const fileSystem = options.fileSystem || fs;
  const content = fileSystem.readFileSync(filename, 'utf8');
  const extension = path.extname(filename);
  let type;

  if (extension === '.styl') {
    debug('paperwork: converting .styl into the stylus type');
    type = 'stylus';
  } else if (extension === '.cjs') {
    debug('paperwork: converting .cjs into the commonjs type');
    type = 'commonjs';
  // We need to sniff the JS module to find its type, not by extension.
  // Other possible types pass through normally
  } else if (!['.js', '.jsx'].includes(extension)) {
    debug('paperwork: stripping the dot from the extension to serve as the type');
    type = extension.replace('.', '');
  }

  if (type) {
    debug('paperwork: setting the module type');
    options.type = type;
  }

  debug('paperwork: invoking precinct');
  const dependencies = precinct(content, options);

  if (!options.includeCore) {
    return dependencies.filter(dependency => {
      if (dependency.startsWith('node:')) return false;

      // In Node.js 18, node:test is a builtin but shows up under natives["test"],
      // but can only be imported by "node:test." We're correcting this so "test"
      // isn't unnecessarily stripped from the imports
      if (dependency === 'test') {
        debug('paperwork: allowing test import to avoid builtin/natives consideration');
        return true;
      }

      return !builtinModules.includes(dependency);
    });
  }

  debug('paperwork: got these results\n', dependencies);
  return dependencies;
}

precinct.paperwork = paperwork;

/**
 * @param {string} type
 * @param {PrecinctOptions} options
 */
function getDetective(type, options) {
  const mixedMode = options.es6?.mixedImports;

  switch (type) {
    case 'cjs':
    case 'commonjs': {
      return mixedMode ? detectiveEs6Cjs : detectiveCjs;
    }

    case 'css': {
      return detectivePostcss;
    }

    case 'amd': {
      return detectiveAmd;
    }

    case 'mjs':
    case 'esm':
    case 'es6': {
      return mixedMode ? detectiveEs6Cjs : detectiveEs6;
    }

    case 'sass': {
      return detectiveSass;
    }

    case 'less': {
      return detectiveLess;
    }

    case 'scss': {
      return detectiveScss;
    }

    case 'stylus': {
      return detectiveStylus;
    }

    case 'ts': {
      return loadDetectiveTypeScript();
    }

    case 'tsx': {
      return loadDetectiveTypeScript().tsx;
    }

    case 'vue': {
      return loadDetectiveVue();
    }

    default:
      // nothing
  }
}

/**
 * @param {Record<string, any>} ast
 * @param {Record<string, any>} [detectiveOptions]
 */
function detectiveEs6Cjs(ast, detectiveOptions) {
  return [
    ...detectiveEs6(ast, detectiveOptions),
    ...detectiveCjs(ast, detectiveOptions)
  ];
}

export default precinct;
export { paperwork };
