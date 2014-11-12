var precinct = require('../'),
    assert = require('assert');

describe('node-precinct', function() {
  it('grabs dependencies of amd modules', function () {
    var amd  = precinct(__dirname + '/amd.js');
    assert(amd.indexOf('./a') !== -1);
    assert(amd.indexOf('./b') !== -1);
    assert(amd.length === 2);
  });

  it('grabs dependencies of commonjs modules', function () {
    var cjs  = precinct(__dirname + '/commonjs.js');
    assert(cjs.indexOf('./a') !== -1);
    assert(cjs.indexOf('./b') !== -1);
    assert(cjs.length === 2);
  });

  it('grabs dependencies of es6 modules', function () {
    var cjs  = precinct(__dirname + '/es6.js');
    assert(cjs.indexOf('lib') !== -1);
    assert(cjs.length === 1);
  });

  it('yields no dependencies for es6 modules with no imports', function () {
    var cjs = precinct(__dirname + '/es6NoImport.js');
    assert(!cjs.length);
  });

  it('yields no dependencies for non-modules', function () {
    var none = precinct(__dirname + '/none.js');
    assert(!none.length);
  });
});




