var precinct = require('../');
var assert = require('assert');
var fs = require('fs');

describe('node-precinct', function() {
  it('accepts an AST', function() {
    var ast = {
      type: 'Program',
      body: [{
        type: 'VariableDeclaration',
        declarations: [{
          type: 'VariableDeclarator',
          id: {
            type: 'Identifier',
            name: 'a'
          },
          init: {
            type: 'CallExpression',
            callee: {
              type: 'Identifier',
              name: 'require'
            },
            arguments: [{
              type: 'Literal',
              value: './a',
              raw: './a'
            }]
          }
        }],
        kind: 'var'
      }]
    };

    var deps = precinct(ast);
    assert(deps.length === 1);
  });

  it('grabs dependencies of amd modules', function() {
    var amd = precinct(fs.readFileSync(__dirname + '/amd.js', 'utf8'));
    assert(amd.indexOf('./a') !== -1);
    assert(amd.indexOf('./b') !== -1);
    assert(amd.length === 2);
  });

  it('grabs dependencies of commonjs modules', function() {
    var cjs  = precinct(fs.readFileSync(__dirname + '/commonjs.js', 'utf8'));
    assert(cjs.indexOf('./a') !== -1);
    assert(cjs.indexOf('./b') !== -1);
    assert(cjs.length === 2);
  });

  it('grabs dependencies of es6 modules', function() {
    var cjs  = precinct(fs.readFileSync(__dirname + '/es6.js', 'utf8'));
    assert(cjs.indexOf('lib') !== -1);
    assert(cjs.length === 1);
  });

  it('grabs dependencies of es6 modules even with small errors', function() {
    var filePath = __dirname + '/es6WithError.js';
    var cjs  = precinct(fs.readFileSync(filePath, 'utf8'));
    assert(cjs.indexOf('lib') !== -1);
    assert(cjs.length === 1);
  });

  it('grabs dependencies of sass files', function() {
    var content = fs.readFileSync(__dirname + '/styles.scss', 'utf8');
    var sass = precinct(content, 'sass');
    assert(sass[0] === '_foo');
    assert(sass[1] === 'baz.scss');
    assert(sass.length === 2);
  });

  it('yields no dependencies for es6 modules with no imports', function() {
    var cjs = precinct(fs.readFileSync(__dirname + '/es6NoImport.js', 'utf8'));
    assert(!cjs.length);
  });

  it('yields no dependencies for non-modules', function() {
    var none = precinct(fs.readFileSync(__dirname + '/none.js', 'utf8'));
    assert(!none.length);
  });

  it('ignores unparsable .js files', function() {
    var cjs;
    assert.doesNotThrow(function() {
      cjs = precinct(fs.readFileSync(__dirname + '/unparseable.js', 'utf8'));
    }, SyntaxError);
    assert(cjs.indexOf('lib') < 0);
    assert(cjs.length === 0);
  });

  it('does not blow up when parsing a gruntfile #2', function() {
    assert.doesNotThrow(function() {
      precinct(fs.readFileSync(__dirname + '/Gruntfile.js', 'utf8'));
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
