var getModuleType = require('module-definition');
var detective = require('detective');
var detectiveAmd = require('detective-amd');
var detectiveEs6 = require('detective-es6');
var detectiveSass = require('detective-sass');
var fs = require('fs');
var path = require('path');

/**
 * Finds the list of dependencies for the given file
 * @param {String} content - path of the file whose dependencies to find
 * @param {String} [type] - The type of content being passed in. Useful if you want to use a non-js detective
 * @return {String[]}
 */
module.exports = function(content, type) {
  var dependencies = [];
  var theDetective;

  type = type || getModuleType.fromSource(content);

  switch (type) {
    case 'commonjs':
      theDetective = detective;
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
    dependencies = theDetective(content);
  }

  return dependencies;
};

/**
 * Returns the dependencies for the given file path
 * @param  {String} filename
 * @return {String[]}
 */
module.exports.paperwork = function(filename) {
  var content = fs.readFileSync(filename, 'utf8');
  var type;

  if (isSassFile(filename)) {
    type = 'sass';
  }

  return this(content, type);
}

/**
 * @param  {String}  filename
 * @return {Boolean}
 */
function isSassFile(filename) {
  return path.extname(filename) === '.scss' ||
         path.extname(filename) === '.sass';
}
