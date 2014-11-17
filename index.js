var getModuleType = require('module-definition');
var detective = require('detective');
var detectiveAmd = require('detective-amd');
var detectiveEs6 = require('detective-es6');
var detectiveSass = require('detective-sass');
var fs = require('fs');

/**
 * Finds the list of dependencies for the given file
 * @param {String} file - path of the file whose dependencies to find
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
