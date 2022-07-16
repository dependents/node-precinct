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

describe('node-precinct', () => {
  it('accepts an AST', () => {
    const deps = precinct(ast);
    assert.equal(deps.length, 1);
  });

  it('dangles off a given ast', () => {
    assert.deepEqual(precinct.ast, ast);
  });

  it('dangles off the parsed ast from a .js file', () => {
    precinct(read('amd.js'));
    assert.ok(precinct.ast);
    assert.notDeepEqual(precinct.ast, ast);
  });

  it('dangles off the parsed ast from a scss detective', () => {
    precinct(read('styles.scss'), { type: 'scss' });
    assert.notDeepEqual(precinct.ast, {});
  });

  it('dangles off the parsed ast from a sass detective', () => {
    precinct(read('styles.sass'), { type: 'sass' });
    assert.notDeepEqual(precinct.ast, {});
  });

  it('grabs dependencies of amd modules', () => {
    const amd = precinct(read('amd.js'));
    assert.ok(amd.includes('./a'));
    assert.ok(amd.includes('./b'));
    assert.equal(amd.length, 2);
  });

  it('grabs dependencies of commonjs modules', () => {
    const cjs = precinct(read('commonjs.js'));
    assert.ok(cjs.includes('./a'));
    assert.ok(cjs.includes('./b'));
    assert.equal(cjs.length, 2);
  });

  it('grabs dependencies of es6 modules', () => {
    const cjs = precinct(read('es6.js'));
    assert.ok(cjs.includes('lib'));
    assert.equal(cjs.length, 1);
  });

  it('grabs dependencies of es6 modules with embedded jsx', () => {
    const cjs = precinct(read('jsx.js'));
    assert.ok(cjs.includes('lib'));
    assert.equal(cjs.length, 1);
  });

  it('grabs dependencies of es6 modules with embedded es7', () => {
    const cjs = precinct(read('es7.js'));
    assert.ok(cjs.includes('lib'));
    assert.equal(cjs.length, 1);
  });

  it('does not grabs dependencies of es6 modules with syntax errors', () => {
    const cjs = precinct(read('es6WithError.js'));
    assert.equal(cjs.length, 0);
  });

  it('grabs dependencies of css files', () => {
    const css = precinct(read('styles.css'), { type: 'css' });
    assert.deepEqual(css, ['foo.css', 'baz.css', 'bla.css', 'another.css']);
  });

  it('grabs dependencies of scss files', () => {
    const scss = precinct(read('styles.scss'), { type: 'scss' });
    assert.deepEqual(scss, ['_foo', 'baz.scss']);
  });

  it('grabs dependencies of sass files', () => {
    const sass = precinct(read('styles.sass'), { type: 'sass' });
    assert.deepEqual(sass, ['_foo']);
  });

  it('grabs dependencies of stylus files', () => {
    const result = precinct(read('styles.styl'), { type: 'stylus' });
    const expected = ['mystyles', 'styles2.styl', 'styles3.styl', 'styles4'];

    assert.deepEqual(result, expected);
  });

  it('grabs dependencies of less files', () => {
    const result = precinct(read('styles.less'), { type: 'less' });
    const expected = ['_foo', '_bar.css', 'baz.less'];

    assert.deepEqual(result, expected);
  });

  it('grabs dependencies of typescript files', () => {
    const result = precinct(read('typescript.ts'), { type: 'ts' });
    const expected = ['fs', 'lib', './bar', './my-module.js', './ZipCodeValidator'];

    assert.deepEqual(result, expected);
  });

  it('grabs dependencies of typescript tsx files', () => {
    const result = precinct(read('module.tsx'), { type: 'tsx' });
    const expected = ['./none'];

    assert.deepEqual(result, expected);
  });

  it('does not grabs dependencies of typescript modules with syntax errors', () => {
    const result = precinct(read('typescriptWithError.ts'));
    assert.equal(result.length, 0);
  });

  it('supports the object form of type configuration', () => {
    const result = precinct(read('styles.styl'), { type: 'stylus' });
    const expected = ['mystyles', 'styles2.styl', 'styles3.styl', 'styles4'];

    assert.deepEqual(result, expected);
  });

  it('yields no dependencies for es6 modules with no imports', () => {
    const cjs = precinct(read('es6NoImport.js'));
    assert.equal(cjs.length, 0);
  });

  it('yields no dependencies for non-modules', () => {
    const none = precinct(read('none.js'));
    assert.equal(none.length, 0);
  });

  it('ignores unparsable .js files', () => {
    const cjs = precinct(read('unparseable.js'));

    assert.ok(!cjs.includes('lib'));
    assert.equal(cjs.length, 0);
  });

  it('does not throw on unparsable .js files', () => {
    assert.doesNotThrow(() => {
      precinct(read('unparseable.js'));
    }, SyntaxError);
  });

  it('does not blow up when parsing a gruntfile #2', () => {
    assert.doesNotThrow(() => {
      precinct(read('Gruntfile.js'));
    });
  });

  describe('paperwork', () => {
    it('grabs dependencies of jsx files', () => {
      const result = precinct.paperwork(`${__dirname}/fixtures/module.jsx`);
      const expected = ['./es6NoImport'];

      assert.deepEqual(result, expected);
    });

    it('uses fileSystem from options if provided', () => {
      const fsMock = {
        readFileSync(path) {
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

    it('returns the dependencies for the given filepath', () => {
      assert.notEqual(precinct.paperwork(`${__dirname}/fixtures/es6.js`).length, 0);
      assert.notEqual(precinct.paperwork(`${__dirname}/fixtures/styles.scss`).length, 0);
      assert.notEqual(precinct.paperwork(`${__dirname}/fixtures/typescript.ts`).length, 0);
      assert.notEqual(precinct.paperwork(`${__dirname}/fixtures/styles.css`).length, 0);
    });

    it('throws if the file cannot be found', () => {
      assert.throws(() => {
        precinct.paperwork('foo');
      });
    });

    it('filters out core modules if options.includeCore is false', () => {
      const deps = precinct.paperwork(`${__dirname}/fixtures/coreModules.js`, {
        includeCore: false
      });

      assert.equal(deps.length, 0);
    });

    it('handles cjs files as commonjs', () => {
      const deps = precinct.paperwork(`${__dirname}/fixtures/commonjs.cjs`);
      assert.ok(deps.includes('./a'));
      assert.ok(deps.includes('./b'));
    });

    it('does not filter out core modules by default', () => {
      const deps = precinct.paperwork(`${__dirname}/fixtures/coreModules.js`);
      assert.notEqual(deps.length, 0);
    });

    it('supports passing detective configuration', () => {
      const stub = sinon.stub().returns([]);
      const revert = precinct.__set__('detectiveAmd', stub);
      const config = {
        amd: {
          skipLazyLoaded: true
        }
      };

      precinct.paperwork(`${__dirname}/fixtures/amd.js`, {
        includeCore: false,
        amd: config.amd
      });

      assert.deepEqual(stub.args[0][1].skipLazyLoaded, config.amd.skipLazyLoaded);
      revert();
    });

    describe('when given detective configuration', () => {
      it('still does not filter out core module by default', () => {
        const stub = sinon.stub().returns([]);
        const revert = precinct.__set__('precinct', stub);

        precinct.paperwork(`${__dirname}/fixtures/amd.js`, {
          amd: {
            skipLazyLoaded: true
          }
        });

        assert.equal(stub.args[0][1].includeCore, true);
        revert();
      });
    });
  });

  describe('when given a configuration object', () => {
    it('passes amd config to the amd detective', () => {
      const stub = sinon.stub();
      const revert = precinct.__set__('detectiveAmd', stub);
      const config = {
        amd: {
          skipLazyLoaded: true
        }
      };

      precinct(read('amd.js'), config);

      assert.deepEqual(stub.args[0][1].skipLazyLoaded, config.amd.skipLazyLoaded);
      revert();
    });

    describe('that sets mixedImports for es6', () => {
      describe('for a file identified as es6', () => {
        it('returns both the commonjs and es6 dependencies', () => {
          const deps = precinct(read('es6MixedImport.js'), {
            es6: {
              mixedImports: true
            }
          });

          assert.equal(deps.length, 2);
        });
      });

      describe('for a file identified as cjs', () => {
        it('returns both the commonjs and es6 dependencies', () => {
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

  describe('when lazy exported dependencies in CJS', () => {
    it('grabs those lazy dependencies', () => {
      const cjs = precinct(read('cjsExportLazy.js'));

      assert.equal(cjs[0], './amd');
      assert.equal(cjs[1], './es6');
      assert.equal(cjs[2], './es7');
      assert.equal(cjs.length, 3);
    });
  });

  describe('when a main require is used', () => {
    it('grabs those dependencies', () => {
      const cjs = precinct(read('commonjs-requiremain.js'));

      assert.equal(cjs[0], './b');
      assert.equal(cjs.length, 1);
    });
  });

  describe('when given an es6 file', () => {
    describe('that uses CJS imports for lazy dependencies', () => {
      describe('and mixedImport mode is turned on', () => {
        it('grabs the lazy imports', () => {
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

      describe('and mixedImport mode is turned off', () => {
        it('does not grab any imports', () => {
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
        assert.ok(!deps.includes('node:nonexistant'));
        assert.deepEqual(deps, ['streams']);
      });

      it("understands quirks around some modules only being addressable via node: prefix", () => {
        const deps = precinct.paperwork(path.join(__dirname, 'fixtures', 'requiretest.js'), {
          includeCore: false
        });
        assert.deepEqual(deps, ['test']);
      })
    });

    describe('that uses dynamic imports', () => {
      it('grabs the dynamic import', () => {
        const es6 = precinct(read('es6DynamicImport.js'));
        assert.equal(es6[0], './bar');
      });
    });
  });

  it('handles the esm extension', () => {
    const cjs = precinct(read('es6.esm'));
    assert.ok(cjs.includes('lib'));
    assert.equal(cjs.length, 1);
  });

  it('handles the mjs extension', () => {
    const cjs = precinct(read('es6.mjs'));
    assert.ok(cjs.includes('lib'));
    assert.equal(cjs.length, 1);
  });
});
