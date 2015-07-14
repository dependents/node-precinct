var getModuleType = require('module-definition');

var justParse = require('just-parse');

var detectiveCjs = require('detective-cjs');
var detectiveAmd = require('detective-amd');
var detectiveEs6 = require('detective-es6');
var detectiveSass = require('detective-sass');
var detectiveStylus = require('detective-stylus');

var fs = require('fs');
var path = require('path');

var natives = process.binding('natives');
var debug = require('debug')('precinct');

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
    debug('parsing content');

    // Parse once and distribute the AST to all detectives
    ast = justParse(content);

    debug('parsed result is an ' + (typeof ast));

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
    case 'stylus':
      theDetective = detectiveStylus;
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
  } else if (isStylusFile(filename)) {
    type = 'stylus';
  } else if (isLessFile(filename)) {
    type = 'less';
  }

  var deps = this(content, type);

  if (!options.includeCore) {
    return deps.filter(function(d) {
      return !natives[d];
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
 * @param  {String}  filename
 * @return {Boolean}
 */
function isStylusFile(filename) {
  return path.extname(filename) === '.styl';
}

/**
 * @param  {String}  filename
 * @return {Boolean}
 */
function isLessFile(filename) {
  return path.extname(filename) === '.less';
}
