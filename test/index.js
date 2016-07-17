var assert = require('assert');
var fs = require('fs');
var path = require('path');
var rewire = require('rewire');

var ast = require('./exampleAST');
var precinct = rewire('../');

function read(filename) {
  return fs.readFileSync(path.join(__dirname, filename), 'utf8');
}

describe('node-precinct', function() {
  it('accepts an AST', function() {
    var deps = precinct(ast);
    assert(deps.length === 1);
  });

  it('dangles off a given ast', function() {
    var deps = precinct(ast);
    assert.deepEqual(precinct.ast, ast);
  });

  it('dangles off the parsed ast from a .js file', function() {
    precinct(read('amd.js'));
    assert.ok(precinct.ast);
    assert.notDeepEqual(precinct.ast, ast);
  });

  it('dangles off the parsed ast from a non-js file\'s detective that dangles its parsed ast', function() {
    precinct(read('styles.scss'), 'sass');
    assert.notDeepEqual(precinct.ast, {});
  });

  it('grabs dependencies of amd modules', function() {
    var amd = precinct(read('amd.js'));
    assert(amd.indexOf('./a') !== -1);
    assert(amd.indexOf('./b') !== -1);
    assert(amd.length === 2);
  });

  it('grabs dependencies of commonjs modules', function() {
    var cjs  = precinct(read('commonjs.js'));
    assert(cjs.indexOf('./a') !== -1);
    assert(cjs.indexOf('./b') !== -1);
    assert(cjs.length === 2);
  });

  it('grabs dependencies of es6 modules', function() {
    var cjs  = precinct(read('es6.js'));
    assert(cjs.indexOf('lib') !== -1);
    assert(cjs.length === 1);
  });

  it('grabs dependencies of es6 modules with embedded jsx', function() {
    var cjs  = precinct(read('jsx.js'));
    assert(cjs.indexOf('lib') !== -1);
    assert(cjs.length === 1);
  });

  it('grabs dependencies of es6 modules with embedded es7', function() {
    var cjs  = precinct(read('es7.js'));
    assert(cjs.indexOf('lib') !== -1);
    assert(cjs.length === 1);
  });

  it('does not grabs dependencies of es6 modules with syntax errors', function() {
    var cjs  = precinct(read('es6WithError.js'));
    assert(cjs.length === 0);
  });

  it('grabs dependencies of sass files', function() {
    var sass = precinct(read('styles.scss'), 'sass');
    assert.deepEqual(sass, ['_foo', 'baz.scss']);
  });

  it('grabs dependencies of stylus files', function() {
    var result = precinct(read('styles.styl'), 'stylus');
    var expected = ['mystyles', 'styles2.styl', 'styles3.styl', 'styles4'];

    assert.deepEqual(result, expected);
  });

  it('yields no dependencies for es6 modules with no imports', function() {
    var cjs = precinct(read('es6NoImport.js'));
    assert.equal(cjs.length, 0);
  });

  it('yields no dependencies for non-modules', function() {
    var none = precinct(read('none.js'));
    assert.equal(none.length, 0);
  });

  it('ignores unparsable .js files', function() {
    var cjs = precinct(read('unparseable.js'));

    assert(cjs.indexOf('lib') < 0);
    assert.equal(cjs.length, 0);
  });

  it('does not throw on unparsable .js files', function() {
    assert.doesNotThrow(function() {
      precinct(read('unparseable.js'));
    }, SyntaxError);
  });

  it('does not blow up when parsing a gruntfile #2', function() {
    assert.doesNotThrow(function() {
      precinct(read('Gruntfile.js'));
    });
  });

  describe('paperwork', function() {
    it('returns the dependencies for the given filepath', function() {
      assert(precinct.paperwork(__dirname + '/es6.js').length);
      assert(precinct.paperwork(__dirname + '/styles.scss').length);
    });

    it('throws if the file cannot be found', function() {
      assert.throws(function() {
        precinct.paperwork('foo');
      });
    });

    it('filters out core modules if options.includeCore is false', function() {
      var deps = precinct.paperwork(__dirname + '/coreModules.js', {
        includeCore: false
      });

      assert(!deps.length);
    });

    it('does not filter out core modules by default', function() {
      var deps = precinct.paperwork(__dirname + '/coreModules.js');
      assert(deps.length);
    });
  });
});
