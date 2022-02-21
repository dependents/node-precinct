/* eslint-env mocha */

'use strict';

const assert = require('assert').strict;
const fs = require('fs');
const path = require('path');
const rewire = require('rewire');
const sinon = require('sinon');
const ast = require('./fixtures/exampleAST');
const precinct = rewire('../index.js');

function read(filename) {
  return fs.readFileSync(path.join(__dirname, 'fixtures', filename), 'utf8');
}

describe('node-precinct', function() {
  it('accepts an AST', function() {
    const deps = precinct(ast);
    assert(deps.length === 1);
  });

  it('dangles off a given ast', function() {
    const deps = precinct(ast);
    assert.deepEqual(precinct.ast, ast);
  });

  it('dangles off the parsed ast from a .js file', function() {
    precinct(read('amd.js'));
    assert.ok(precinct.ast);
    assert.notDeepEqual(precinct.ast, ast);
  });

  it('dangles off the parsed ast from a scss detective', function() {
    precinct(read('styles.scss'), 'scss');
    assert.notDeepEqual(precinct.ast, {});
  });

  it('dangles off the parsed ast from a sass detective', function() {
    precinct(read('styles.sass'), 'sass');
    assert.notDeepEqual(precinct.ast, {});
  });

  it('grabs dependencies of amd modules', function() {
    const amd = precinct(read('amd.js'));
    assert(amd.includes('./a'));
    assert(amd.includes('./b'));
    assert(amd.length === 2);
  });

  it('grabs dependencies of commonjs modules', function() {
    const cjs = precinct(read('commonjs.js'));
    assert(cjs.includes('./a'));
    assert(cjs.includes('./b'));
    assert(cjs.length === 2);
  });

  it('grabs dependencies of es6 modules', function() {
    const cjs = precinct(read('es6.js'));
    assert(cjs.includes('lib'));
    assert(cjs.length === 1);
  });

  it('grabs dependencies of es6 modules with embedded jsx', function() {
    const cjs = precinct(read('jsx.js'));
    assert(cjs.includes('lib'));
    assert(cjs.length === 1);
  });

  it('grabs dependencies of es6 modules with embedded es7', function() {
    const cjs = precinct(read('es7.js'));
    assert(cjs.includes('lib'));
    assert(cjs.length === 1);
  });

  it('does not grabs dependencies of es6 modules with syntax errors', function() {
    const cjs = precinct(read('es6WithError.js'));
    assert(cjs.length === 0);
  });

  it('grabs dependencies of css files', function() {
    const css = precinct(read('styles.css'), 'css');
    assert.deepEqual(css, ['foo.css', 'baz.css', 'bla.css', 'another.css']);
  });

  it('grabs dependencies of scss files', function() {
    const scss = precinct(read('styles.scss'), 'scss');
    assert.deepEqual(scss, ['_foo', 'baz.scss']);
  });

  it('grabs dependencies of sass files', function() {
    const sass = precinct(read('styles.sass'), 'sass');
    assert.deepEqual(sass, ['_foo']);
  });

  it('grabs dependencies of stylus files', function() {
    const result = precinct(read('styles.styl'), 'stylus');
    const expected = ['mystyles', 'styles2.styl', 'styles3.styl', 'styles4'];

    assert.deepEqual(result, expected);
  });

  it('grabs dependencies of less files', function() {
    const result = precinct(read('styles.less'), 'less');
    const expected = ['_foo', '_bar.css', 'baz.less'];

    assert.deepEqual(result, expected);
  });

  it('grabs dependencies of typescript files', function() {
    const result = precinct(read('typescript.ts'), 'ts');
    const expected = ['fs', 'lib', './bar', './my-module.js', './ZipCodeValidator'];

    assert.deepEqual(result, expected);
  });

  it('grabs dependencies of typescript tsx files', function() {
    const result = precinct(read('module.tsx'), 'tsx');
    const expected = ['./none'];

    assert.deepEqual(result, expected);
  });

  it('does not grabs dependencies of typescript modules with syntax errors', function() {
    const result = precinct(read('typescriptWithError.ts'));
    assert(result.length === 0);
  });

  it('supports the object form of type configuration', function() {
    const result = precinct(read('styles.styl'), {type: 'stylus'});
    const expected = ['mystyles', 'styles2.styl', 'styles3.styl', 'styles4'];

    assert.deepEqual(result, expected);
  });

  it('yields no dependencies for es6 modules with no imports', function() {
    const cjs = precinct(read('es6NoImport.js'));
    assert.equal(cjs.length, 0);
  });

  it('yields no dependencies for non-modules', function() {
    const none = precinct(read('none.js'));
    assert.equal(none.length, 0);
  });

  it('ignores unparsable .js files', function() {
    const cjs = precinct(read('unparseable.js'));

    assert(!cjs.includes('lib'));
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
    it('grabs dependencies of jsx files', function() {
      const result = precinct.paperwork(__dirname + '/fixtures/module.jsx');
      const expected = ['./es6NoImport'];

      assert.deepEqual(result, expected);
    });

    it('uses fileSystem from options if provided', function() {
      const fsMock = {
        readFileSync(path, encoding) {
          assert.equal(path, '/foo.js');
          return 'var assert = require("assert");';
        }
      };

      const options = {
        fileSystem: fsMock
      };
      const results = precinct.paperwork('/foo.js', options);
      assert.equal(results.length, 1);
      assert.equal(results[0], 'assert');
    });

    it('returns the dependencies for the given filepath', function() {
      assert.ok(precinct.paperwork(__dirname + '/fixtures/es6.js').length);
      assert.ok(precinct.paperwork(__dirname + '/fixtures/styles.scss').length);
      assert.ok(precinct.paperwork(__dirname + '/fixtures/typescript.ts').length);
      assert.ok(precinct.paperwork(__dirname + '/fixtures/styles.css').length);
    });

    it('throws if the file cannot be found', function() {
      assert.throws(function() {
        precinct.paperwork('foo');
      });
    });

    it('filters out core modules if options.includeCore is false', function() {
      const deps = precinct.paperwork(__dirname + '/fixtures/coreModules.js', {
        includeCore: false
      });

      assert(!deps.length);
    });

    it('handles cjs files as commonjs', function() {
      const deps = precinct.paperwork(__dirname + '/fixtures/commonjs.cjs');
      assert(deps.includes('./a'));
      assert(deps.includes('./b'));
    });

    it('does not filter out core modules by default', function() {
      const deps = precinct.paperwork(__dirname + '/fixtures/coreModules.js');
      assert(deps.length);
    });

    it('supports passing detective configuration', function() {
      const stub = sinon.stub().returns([]);
      const revert = precinct.__set__('detectiveAmd', stub);
      const config = {
        amd: {
          skipLazyLoaded: true
        }
      };

      const deps = precinct.paperwork(__dirname + '/fixtures/amd.js', {
        includeCore: false,
        amd: config.amd
      });

      assert.deepEqual(stub.args[0][1], config.amd);
      revert();
    });

    describe('when given detective configuration', function() {
      it('still does not filter out core module by default', function() {
        const stub = sinon.stub().returns([]);
        const revert = precinct.__set__('precinct', stub);

        const deps = precinct.paperwork(__dirname + '/fixtures/amd.js', {
          amd: {
            skipLazyLoaded: true
          }
        });

        assert.equal(stub.args[0][1].includeCore, true);
        revert();
      });
    });
  });

  describe('when given a configuration object', function() {
    it('passes amd config to the amd detective', function() {
      const stub = sinon.stub();
      const revert = precinct.__set__('detectiveAmd', stub);
      const config = {
        amd: {
          skipLazyLoaded: true
        }
      };

      precinct(read('amd.js'), config);

      assert.deepEqual(stub.args[0][1], config.amd);
      revert();
    });

    describe('that sets mixedImports for es6', function() {
      describe('for a file identified as es6', function() {
        it('returns both the commonjs and es6 dependencies', function() {
          const deps = precinct(read('es6MixedImport.js'), {
            es6: {
              mixedImports: true
            }
          });

          assert.equal(deps.length, 2);
        });
      });

      describe('for a file identified as cjs', function() {
        it('returns both the commonjs and es6 dependencies', function() {
          const deps = precinct(read('cjsMixedImport.js'), {
            es6: {
              mixedImports: true
            }
          });

          assert.equal(deps.length, 2);
        });
      });
    });
  });

  describe('when lazy exported dependencies in CJS', function() {
    it('grabs those lazy dependencies', function() {
      const cjs = precinct(read('cjsExportLazy.js'));

      assert.equal(cjs[0], './amd');
      assert.equal(cjs[1], './es6');
      assert.equal(cjs[2], './es7');
      assert.equal(cjs.length, 3);
    });
  });

  describe('when a main require is used', function() {
    it('grabs those dependencies', function() {
      const cjs = precinct(read('commonjs-requiremain.js'));

      assert.equal(cjs[0], './b');
      assert.equal(cjs.length, 1);
    });
  });

  describe('when given an es6 file', function() {
    describe('that uses CJS imports for lazy dependencies', function() {
      describe('and mixedImport mode is turned on', function() {
        it('grabs the lazy imports', function() {
          const es6 = precinct(read('es6MixedExportLazy.js'), {
            es6: {
              mixedImports: true
            }
          });

          assert.equal(es6[0], './amd');
          assert.equal(es6[1], './es6');
          assert.equal(es6[2], './es7');
          assert.equal(es6.length, 3);
        });
      });

      describe('and mixedImport mode is turned off', function() {
        it('does not grab any imports', function() {
          const es6 = precinct(read('es6MixedExportLazy.js'));

          assert.equal(es6.length, 0);
        });
      });
    });

    describe('that imports node-internal with node:-prefix', () => {
      it('assumes that it exists', () => {
        const deps = precinct.paperwork(path.join(__dirname, 'fixtures', 'internalNodePrefix.js'), {
          includeCore: false
        });
        assert(!deps.includes('node:nonexistant'));
        assert.deepEqual(deps, ['streams']);
      });
    });

    describe('that uses dynamic imports', function() {
      it('grabs the dynamic import', function() {
        const es6 = precinct(read('es6DynamicImport.js'));

        assert.equal(es6[0], './bar');
      });
    });
  });

  it('handles the esm extension', function() {
    const cjs = precinct(read('es6.esm'));
    assert(cjs.includes('lib'));
    assert(cjs.length === 1);
  });

  it('handles the mjs extension', function() {
    const cjs = precinct(read('es6.mjs'));
    assert(cjs.includes('lib'));
    assert(cjs.length === 1);
  });
});
