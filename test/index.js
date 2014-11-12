var precinct = require('../'),
    assert = require('assert'),
    fs = require('fs');

describe('node-precinct', function() {
  it('grabs dependencies of amd modules', function () {
    var amd  = precinct(fs.readFileSync(__dirname + '/amd.js', 'utf8'));
    assert(amd.indexOf('./a') !== -1);
    assert(amd.indexOf('./b') !== -1);
    assert(amd.length === 2);
  });

  it('grabs dependencies of commonjs modules', function () {
    var cjs  = precinct(fs.readFileSync(__dirname + '/commonjs.js', 'utf8'));
    assert(cjs.indexOf('./a') !== -1);
    assert(cjs.indexOf('./b') !== -1);
    assert(cjs.length === 2);
  });

  it('grabs dependencies of es6 modules', function () {
    var cjs  = precinct(fs.readFileSync(__dirname + '/es6.js', 'utf8'));
    assert(cjs.indexOf('lib') !== -1);
    assert(cjs.length === 1);
  });

  it('yields no dependencies for es6 modules with no imports', function () {
    var cjs = precinct(fs.readFileSync(__dirname + '/es6NoImport.js', 'utf8'));
    assert(!cjs.length);
  });

  it('yields no dependencies for non-modules', function () {
    var none = precinct(fs.readFileSync(__dirname + '/none.js', 'utf8'));
    assert(!none.length);
  });
});




