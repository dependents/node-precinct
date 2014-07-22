var getModuleType = require('module-definition'),
    detective = require('detective'),
    detectiveAmd = require('detective-amd'),
    fs = require('fs');

/**
 * Finds the list of dependencies for the given file
 * @param  {String} file - path of the file whose dependencies to find
 * @return {String[]}
 */
module.exports = function(file) {
  var content = fs.readFileSync(file).toString(),
      type = getModuleType.sync(file),
      theDetective,
      dependencies = [];

  switch(type) {
    case 'commonjs':
      theDetective = detective;
      break;
    case 'amd':
      theDetective = detectiveAmd;
      break;
  }

  if (theDetective) {
    dependencies = theDetective(content);
  }

  return dependencies;
};
