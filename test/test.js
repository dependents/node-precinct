/* eslint-env mocha */

'use strict';

const assert = require('assert').strict;
const { readFile } = require('fs/promises');
const path = require('path');
const rewire = require('rewire');
const sinon = require('sinon');
const ast = require('./fixtures/exampleAST.js');

const precinct = rewire('../index.js');

async function read(filename) {
  return readFile(path.join(__dirname, 'fixtures', filename), 'utf8');
}

describe('node-precinct', () => {
  it('accepts an AST', () => {
    const deps = precinct(ast);
    assert.equal(deps.length, 1);
  });

  it('dangles off a given ast', () => {
    assert.deepEqual(precinct.ast, ast);
  });

  it('dangles off the parsed ast from a .js file', async() => {
    precinct(await read('amd.js'));
    assert.ok(precinct.ast);
    assert.notDeepEqual(precinct.ast, ast);
  });

  it('dangles off the parsed ast from a scss detective', async() => {
    precinct(await read('styles.scss'), { type: 'scss' });
    assert.notDeepEqual(precinct.ast, {});
  });

  it('dangles off the parsed ast from a sass detective', async() => {
    precinct(await read('styles.sass'), { type: 'sass' });
    assert.notDeepEqual(precinct.ast, {});
  });

  it('grabs dependencies of amd modules', async() => {
    const amd = precinct(await read('amd.js'));
    assert.equal(amd.includes('./a'), true);
    assert.equal(amd.includes('./b'), true);
    assert.equal(amd.length, 2);
  });

  it('grabs dependencies of commonjs modules', async() => {
    const cjs = precinct(await read('commonjs.js'));
    assert.equal(cjs.includes('./a'), true);
    assert.equal(cjs.includes('./b'), true);
    assert.equal(cjs.length, 2);
  });

  it('grabs dependencies of es6 modules', async() => {
    const cjs = precinct(await read('es6.js'));
    assert.equal(cjs.includes('lib'), true);
    assert.equal(cjs.length, 1);
  });

  it('grabs dependencies of es6 modules with embedded jsx', async() => {
    const cjs = precinct(await read('jsx.js'));
    assert.equal(cjs.includes('lib'), true);
    assert.equal(cjs.length, 1);
  });

  it('grabs dependencies of es6 modules with embedded es7', async() => {
    const cjs = precinct(await read('es7.js'));
    assert.equal(cjs.includes('lib'), true);
    assert.equal(cjs.length, 1);
  });

  it('does not grabs dependencies of es6 modules with syntax errors', async() => {
    const cjs = precinct(await read('es6WithError.js'));
    assert.equal(cjs.length, 0);
  });

  it('grabs dependencies of css files', async() => {
    const css = precinct(await read('styles.css'), { type: 'css' });
    assert.deepEqual(css, ['foo.css', 'baz.css', 'bla.css', 'another.css']);
  });

  it('grabs dependencies of scss files', async() => {
    const scss = precinct(await read('styles.scss'), { type: 'scss' });
    assert.deepEqual(scss, ['_foo', 'baz.scss']);
  });

  it('grabs dependencies of sass files', async() => {
    const sass = precinct(await read('styles.sass'), { type: 'sass' });
    assert.deepEqual(sass, ['_foo']);
  });

  it('grabs dependencies of stylus files', async() => {
    const result = precinct(await read('styles.styl'), { type: 'stylus' });
    const expected = ['mystyles', 'styles2.styl', 'styles3.styl', 'styles4'];

    assert.deepEqual(result, expected);
  });

  it('grabs dependencies of less files', async() => {
    const result = precinct(await read('styles.less'), { type: 'less' });
    const expected = ['_foo', '_bar.css', 'baz.less'];

    assert.deepEqual(result, expected);
  });

  it('grabs dependencies of typescript files', async() => {
    const result = precinct(await read('typescript.ts'), { type: 'ts' });
    const expected = ['fs', 'lib', './bar', './my-module.js', './ZipCodeValidator'];

    assert.deepEqual(result, expected);
  });

  it('grabs dependencies of typescript tsx files', async() => {
    const result = precinct(await read('module.tsx'), { type: 'tsx' });
    const expected = ['./none'];

    assert.deepEqual(result, expected);
  });

  it('does not grabs dependencies of typescript modules with syntax errors', async() => {
    const result = precinct(await read('typescriptWithError.ts'));
    assert.equal(result.length, 0);
  });

  it('supports the object form of type configuration', async() => {
    const result = precinct(await read('styles.styl'), { type: 'stylus' });
    const expected = ['mystyles', 'styles2.styl', 'styles3.styl', 'styles4'];

    assert.deepEqual(result, expected);
  });

  it('yields no dependencies for es6 modules with no imports', async() => {
    const cjs = precinct(await read('es6NoImport.js'));
    assert.equal(cjs.length, 0);
  });

  it('yields no dependencies for non-modules', async() => {
    const none = precinct(await read('none.js'));
    assert.equal(none.length, 0);
  });

  it('ignores unparsable .js files', async() => {
    const cjs = precinct(await read('unparseable.js'));

    assert.equal(cjs.includes('lib'), false);
    assert.equal(cjs.length, 0);
  });

  it('does not throw on unparsable .js files', () => {
    assert.doesNotThrow(async() => {
      precinct(await read('unparseable.js'));
    }, SyntaxError);
  });

  it('does not blow up when parsing a gruntfile #2', () => {
    assert.doesNotThrow(async() => {
      precinct(await read('Gruntfile.js'));
    });
  });

  describe('paperwork', () => {
    it('grabs dependencies of jsx files', () => {
      const result = precinct.paperwork(path.join(__dirname, '/fixtures/module.jsx'));
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

      const results = precinct.paperwork('/foo.js', { fileSystem: fsMock });
      assert.equal(results.length, 1);
      assert.equal(results[0], 'assert');
    });

    it('returns the dependencies for the given filepath', () => {
      assert.notEqual(precinct.paperwork(path.join(__dirname, '/fixtures/es6.js')).length, 0);
      assert.notEqual(precinct.paperwork(path.join(__dirname, '/fixtures/styles.scss')).length, 0);
      assert.notEqual(precinct.paperwork(path.join(__dirname, '/fixtures/typescript.ts')).length, 0);
      assert.notEqual(precinct.paperwork(path.join(__dirname, '/fixtures/styles.css')).length, 0);
    });

    it('throws if the file cannot be found', () => {
      assert.throws(() => {
        precinct.paperwork('foo');
      });
    });

    it('filters out core modules if options.includeCore is false', () => {
      const deps = precinct.paperwork(path.join(__dirname, '/fixtures/coreModules.js'), {
        includeCore: false
      });

      assert.equal(deps.length, 0);
    });

    it('handles cjs files as commonjs', () => {
      const deps = precinct.paperwork(path.join(__dirname, '/fixtures/commonjs.cjs'));
      assert.equal(deps.includes('./a'), true);
      assert.equal(deps.includes('./b'), true);
    });

    it('does not filter out core modules by default', () => {
      const deps = precinct.paperwork(path.join(__dirname, '/fixtures/coreModules.js'));
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

      precinct.paperwork(path.join(__dirname, '/fixtures/amd.js'), {
        includeCore: false,
        amd: config.amd
      });

      assert.deepEqual(stub.args[0][1], config.amd);
      revert();
    });

    describe('when given detective configuration', () => {
      it('still does not filter out core module by default', () => {
        const stub = sinon.stub().returns([]);
        const revert = precinct.__set__('precinct', stub);

        precinct.paperwork(path.join(__dirname, '/fixtures/amd.js'), {
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
    it('passes amd config to the amd detective', async() => {
      const stub = sinon.stub();
      const revert = precinct.__set__('detectiveAmd', stub);
      const config = {
        amd: {
          skipLazyLoaded: true
        }
      };

      precinct(await read('amd.js'), config);

      assert.deepEqual(stub.args[0][1], config.amd);
      revert();
    });

    describe('that sets mixedImports for es6', () => {
      describe('for a file identified as es6', () => {
        it('returns both the commonjs and es6 dependencies', async() => {
          const deps = precinct(await read('es6MixedImport.js'), {
            es6: {
              mixedImports: true
            }
          });

          assert.equal(deps.length, 2);
        });
      });

      describe('for a file identified as cjs', () => {
        it('returns both the commonjs and es6 dependencies', async() => {
          const deps = precinct(await read('cjsMixedImport.js'), {
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
    it('grabs those lazy dependencies', async() => {
      const cjs = precinct(await read('cjsExportLazy.js'));

      assert.equal(cjs[0], './amd');
      assert.equal(cjs[1], './es6');
      assert.equal(cjs[2], './es7');
      assert.equal(cjs.length, 3);
    });
  });

  describe('when a main require is used', () => {
    it('grabs those dependencies', async() => {
      const cjs = precinct(await read('commonjs-requiremain.js'));

      assert.equal(cjs[0], './b');
      assert.equal(cjs.length, 1);
    });
  });

  describe('when given an es6 file', () => {
    describe('that uses CJS imports for lazy dependencies', () => {
      describe('and mixedImport mode is turned on', () => {
        it('grabs the lazy imports', async() => {
          const es6 = precinct(await read('es6MixedExportLazy.js'), {
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
        it('does not grab any imports', async() => {
          const es6 = precinct(await read('es6MixedExportLazy.js'));
          assert.equal(es6.length, 0);
        });
      });
    });

    describe('that imports node-internal with node:-prefix', () => {
      it('assumes that it exists', () => {
        const deps = precinct.paperwork(path.join(__dirname, 'fixtures', 'internalNodePrefix.js'), {
          includeCore: false
        });
        assert.equal(deps.includes('node:nonexistant'), false);
        assert.deepEqual(deps, ['streams']);
      });

      it('understands quirks around some modules only being addressable via node: prefix', () => {
        const deps = precinct.paperwork(path.join(__dirname, 'fixtures', 'requiretest.js'), {
          includeCore: false
        });
        assert.deepEqual(deps, ['test']);
      });
    });

    describe('that uses dynamic imports', () => {
      it('grabs the dynamic import', async() => {
        const es6 = precinct(await read('es6DynamicImport.js'));
        assert.equal(es6[0], './bar');
      });
    });
  });

  it('handles the esm extension', async() => {
    const cjs = precinct(await read('es6.esm'));
    assert.equal(cjs.includes('lib'), true);
    assert.equal(cjs.length, 1);
  });

  it('handles the mjs extension', async() => {
    const cjs = precinct(await read('es6.mjs'));
    assert.equal(cjs.includes('lib'), true);
    assert.equal(cjs.length, 1);
  });
});
