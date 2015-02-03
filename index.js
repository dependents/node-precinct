var getModuleType = require('module-definition');

var acorn = require('acorn/acorn');
var acornLoose = require('acorn/acorn_loose');

var detectiveCjs = require('detective-cjs');
var detectiveAmd = require('detective-amd');
var detectiveEs6 = require('detective-es6');
var detectiveSass = require('detective-sass');

var fs = require('fs');
var path = require('path');

var natives = process.binding('natives');

/**
 * Finds the list of dependencies for the given file
 * @param {String|Object} content - File's content or AST
 * @param {String} [type] - The type of content being passed in. Useful if you want to use a non-js detective
 * @return {String[]}
 */
module.exports = function(content, type) {
  var dependencies = [];
  var theDetective;
  var ast;

  // We assume we're dealing with a JS file
  if (!type && typeof content !== 'object') {
    // Parse once and distribute the AST to all detectives
    ast = getAst(content);
  // SASS files shouldn't be parsed by Acorn
  } else {
    ast = content;
  }

  type = type || getModuleType.fromSource(ast);

  switch (type) {
    case 'commonjs':
      theDetective = detectiveCjs;
      break;
    case 'amd':
      theDetective = detectiveAmd;
      break;
    case 'es6':
      theDetective = detectiveEs6;
      break;
    case 'sass':
      theDetective = detectiveSass;
      break;
  }

  if (theDetective) {
    dependencies = theDetective(ast);
  }

  return dependencies;
};

/**
 * Returns the dependencies for the given file path
 * @param {String} filename
 * @param {Object} [options]
 * @param {Boolean} [options.includeCore=true] - Whether or not to include core modules in the dependency list
 * @return {String[]}
 */
module.exports.paperwork = function(filename, options) {
  options = options || {
    includeCore: true
  };

  var content = fs.readFileSync(filename, 'utf8');
  var type;

  if (isSassFile(filename)) {
    type = 'sass';
  }

  var deps = this(content, type);

  if (!options.includeCore) {
    return deps.filter(function(d) {
      return !isCore(d);
    });
  }

  return deps;
}

/**
 * @param  {String}  filename
 * @return {Boolean}
 */
function isSassFile(filename) {
  return path.extname(filename) === '.scss' ||
         path.extname(filename) === '.sass';
}

/**
 * Whether or not the module is a Node core module
 * @param  {String}  modulePath
 * @return {Boolean}
 */
function isCore(modulePath) {
  return !!natives[modulePath];
}

/**
 * @param  {String}  content
 * @return {Object}  ast
 */
function getAst(content) {
  // jscs: disable
  //
  // First try to parse with strict mode
  // We try both because:
  // https://github.com/marijnh/acorn/commit/3981dfa133bd9ff7eb83bc0a2decbaea42cbf5bd
  //
  // jscs: enable
  var ast;

  var parserOptions = {
    ecmaVersion: 6
  };

  // Returns an object if ok, if not, returns an empty array
  try {
    ast = acorn.parse(content, parserOptions);
  } catch (err) {
    // jscs: disable
    ast = acornLoose.parse_dammit(content, parserOptions);
    // jscs: enable
  }
  return ast;
}
