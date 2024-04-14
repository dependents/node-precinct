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
    const fixture = await read('amd.js');
    precinct(fixture);
    assert.ok(precinct.ast);
    assert.notDeepEqual(precinct.ast, ast);
  });

  it('dangles off the parsed ast from a scss detective', async() => {
    const fixture = await read('styles.scss');
    precinct(fixture, { type: 'scss' });
    assert.notDeepEqual(precinct.ast, {});
  });

  it('dangles off the parsed ast from a sass detective', async() => {
    const fixture = await read('styles.sass');
    precinct(fixture, { type: 'sass' });
    assert.notDeepEqual(precinct.ast, {});
  });

  it('grabs dependencies of amd modules', async() => {
    const fixture = await read('amd.js');
    const result = precinct(fixture);
    assert.equal(result.includes('./a'), true);
    assert.equal(result.includes('./b'), true);
    assert.equal(result.length, 2);
  });

  it('grabs dependencies of commonjs modules', async() => {
    const fixture = await read('commonjs.js');
    const result = precinct(fixture);
    assert.equal(result.includes('./a'), true);
    assert.equal(result.includes('./b'), true);
    assert.equal(result.length, 2);
  });

  it('grabs dependencies of es6 modules', async() => {
    const fixture = await read('es6.js');
    const result = precinct(fixture);
    assert.equal(result.includes('lib'), true);
    assert.equal(result.length, 1);
  });

  it('grabs dependencies of es6 modules with embedded jsx', async() => {
    const fixture = await read('jsx.js');
    const result = precinct(fixture);
    assert.equal(result.includes('lib'), true);
    assert.equal(result.length, 1);
  });

  it('grabs dependencies of es6 modules with embedded es7', async() => {
    const fixture = await read('es7.js');
    const result = precinct(fixture);
    assert.equal(result.includes('lib'), true);
    assert.equal(result.length, 1);
  });

  it('does not grab dependencies of es6 modules with syntax errors', async() => {
    const fixture = await read('es6WithError.js');
    const result = precinct(fixture);
    assert.equal(result.length, 0);
  });

  it('grabs dependencies of css files', async() => {
    const fixture = await read('styles.css');
    const result = precinct(fixture, { type: 'css' });
    assert.deepEqual(result, ['foo.css', 'baz.css', 'bla.css', 'another.css']);
  });

  it('grabs dependencies of scss files', async() => {
    const fixture = await read('styles.scss');
    const result = precinct(fixture, { type: 'scss' });
    assert.deepEqual(result, ['_foo', 'baz.scss']);
  });

  it('grabs dependencies of sass files', async() => {
    const fixture = await read('styles.sass');
    const result = precinct(fixture, { type: 'sass' });
    assert.deepEqual(result, ['_foo']);
  });

  it('grabs dependencies of stylus files', async() => {
    const fixture = await read('styles.styl');
    const result = precinct(fixture, { type: 'stylus' });
    const expected = ['mystyles', 'styles2.styl', 'styles3.styl', 'styles4'];
    assert.deepEqual(result, expected);
  });

  it('grabs dependencies of less files', async() => {
    const fixture = await read('styles.less');
    const result = precinct(fixture, { type: 'less' });
    const expected = ['_foo', '_bar.css', 'baz.less'];
    assert.deepEqual(result, expected);
  });

  it('grabs dependencies of typescript files', async() => {
    const fixture = await read('typescript.ts');
    const result = precinct(fixture, { type: 'ts' });
    const expected = ['fs', 'lib', './bar', './my-module.js', './ZipCodeValidator'];
    assert.deepEqual(result, expected);
  });

  it('grabs dependencies of typescript tsx files', async() => {
    const fixture = await read('module.tsx');
    const result = precinct(fixture, { type: 'tsx' });
    const expected = ['./none'];
    assert.deepEqual(result, expected);
  });

  it('does not grab dependencies of typescript modules with syntax errors', async() => {
    const fixture = await read('typescriptWithError.ts');
    const result = precinct(fixture);
    assert.equal(result.length, 0);
  });

  it('supports the object form of type configuration', async() => {
    const fixture = await read('styles.styl');
    const result = precinct(fixture, { type: 'stylus' });
    const expected = ['mystyles', 'styles2.styl', 'styles3.styl', 'styles4'];
    assert.deepEqual(result, expected);
  });

  it('yields no dependencies for es6 modules with no imports', async() => {
    const fixture = await read('es6NoImport.js');
    const result = precinct(fixture);
    assert.equal(result.length, 0);
  });

  it('yields no dependencies for non-modules', async() => {
    const fixture = await read('none.js');
    const result = precinct(fixture);
    assert.equal(result.length, 0);
  });

  it('ignores unparsable .js files', async() => {
    const fixture = await read('unparseable.js');
    const result = precinct(fixture);
    assert.equal(result.includes('lib'), false);
    assert.equal(result.length, 0);
  });

  it('does not throw on unparsable .js files', async() => {
    const fixture = await read('unparseable.js');
    assert.doesNotThrow(() => {
      precinct(fixture);
    }, SyntaxError);
  });

  it('does not blow up when parsing a gruntfile #2', async() => {
    const fixture = await read('Gruntfile.js');
    assert.doesNotThrow(() => {
      precinct(fixture);
    });
  });

  describe('paperwork', () => {
    it('grabs dependencies of jsx files', () => {
      const fixture = path.join(__dirname, '/fixtures/module.jsx');
      const result = precinct.paperwork(fixture);
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

      const fixture = '/foo.js';
      const results = precinct.paperwork(fixture, { fileSystem: fsMock });
      assert.equal(results.length, 1);
      assert.equal(results[0], 'assert');
    });

    it('returns the dependencies for the given filepath', () => {
      const fixtures = ['es6.js', 'styles.scss', 'typescript.ts', 'styles.css'];

      for (const fixture of fixtures) {
        const result = precinct.paperwork(path.join(__dirname, 'fixtures', fixture));
        assert.notEqual(result.length, 0);
      }
    });

    it('throws if the file cannot be found', () => {
      const fixture = 'foo';
      assert.throws(() => {
        precinct.paperwork(fixture);
      });
    });

    it('filters out core modules if options.includeCore is false', () => {
      const fixture = path.join(__dirname, '/fixtures/coreModules.js');
      const result = precinct.paperwork(fixture, { includeCore: false });
      assert.equal(result.length, 0);
    });

    it('handles cjs files as commonjs', () => {
      const fixture = path.join(__dirname, '/fixtures/commonjs.cjs');
      const result = precinct.paperwork(fixture);
      assert.equal(result.includes('./a'), true);
      assert.equal(result.includes('./b'), true);
    });

    it('does not filter out core modules by default', () => {
      const fixture = path.join(__dirname, '/fixtures/coreModules.js');
      const result = precinct.paperwork(fixture);
      assert.notEqual(result.length, 0);
    });

    it('supports passing detective configuration', () => {
      const stub = sinon.stub().returns([]);
      const revert = precinct.__set__('detectiveAmd', stub);
      const config = {
        amd: {
          skipLazyLoaded: true
        }
      };
      const fixture = path.join(__dirname, '/fixtures/amd.js');

      precinct.paperwork(fixture, {
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
        const fixture = path.join(__dirname, '/fixtures/amd.js');

        precinct.paperwork(fixture, {
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

      const fixture = await read('amd.js');
      precinct(fixture, config);

      assert.deepEqual(stub.args[0][1], config.amd);
      revert();
    });

    describe('that sets mixedImports for es6', () => {
      describe('for a file identified as es6', () => {
        it('returns both the commonjs and es6 dependencies', async() => {
          const fixture = await read('es6MixedImport.js');
          const result = precinct(fixture, {
            es6: {
              mixedImports: true
            }
          });

          assert.equal(result.length, 2);
        });
      });

      describe('for a file identified as cjs', () => {
        it('returns both the commonjs and es6 dependencies', async() => {
          const fixture = await read('cjsMixedImport.js');
          const result = precinct(fixture, {
            es6: {
              mixedImports: true
            }
          });

          assert.equal(result.length, 2);
        });
      });
    });
  });

  describe('when given vue file', () => {
    it('typescript - scss grabs script and style dependencies', () => {
      const vueFile = precinct.paperwork(path.join(__dirname, 'fixtures', 'ts.vue'));

      assert.equal(vueFile[0], './typescript');
      assert.equal(vueFile[1], 'styles.scss');
      assert.equal(vueFile.length, 2);
    });

    it('javascript - sass grabs script and style dependencies', () => {
      const vueFile = precinct.paperwork(path.join(__dirname, 'fixtures', 'js.vue'));

      assert.equal(vueFile[0], './typescript');
      assert.equal(vueFile[1], 'styles.scss');
      assert.equal(vueFile.length, 2);
    });
  });

  describe('when lazy exported dependencies in CJS', () => {
    it('grabs those lazy dependencies', async() => {
      const fixture = await read('cjsExportLazy.js');
      const result = precinct(fixture);
      assert.equal(result[0], './amd');
      assert.equal(result[1], './es6');
      assert.equal(result[2], './es7');
      assert.equal(result.length, 3);
    });
  });

  describe('when a main require is used', () => {
    it('grabs those dependencies', async() => {
      const fixture = await read('commonjs-requiremain.js');
      const result = precinct(fixture);
      assert.equal(result[0], './b');
      assert.equal(result.length, 1);
    });
  });

  describe('when given an es6 file', () => {
    describe('that uses CJS imports for lazy dependencies', () => {
      describe('and mixedImport mode is turned on', () => {
        it('grabs the lazy imports', async() => {
          const fixture = await read('es6MixedExportLazy.js');
          const result = precinct(fixture, {
            es6: {
              mixedImports: true
            }
          });

          assert.equal(result[0], './amd');
          assert.equal(result[1], './es6');
          assert.equal(result[2], './es7');
          assert.equal(result.length, 3);
        });
      });

      describe('and mixedImport mode is turned off', () => {
        it('does not grab any imports', async() => {
          const fixture = await read('es6MixedExportLazy.js');
          const result = precinct(fixture);
          assert.equal(result.length, 0);
        });
      });
    });

    describe('that imports node-internal with node:-prefix', () => {
      it('assumes that it exists', () => {
        const fixture = path.join(__dirname, 'fixtures', 'internalNodePrefix.js');
        const result = precinct.paperwork(fixture, {
          includeCore: false
        });
        assert.equal(result.includes('node:nonexistant'), false);
        assert.deepEqual(result, ['streams']);
      });

      it('understands quirks around some modules only being addressable via node: prefix', () => {
        const fixture = path.join(__dirname, 'fixtures', 'requiretest.js');
        const result = precinct.paperwork(fixture, {
          includeCore: false
        });
        assert.deepEqual(result, ['test']);
      });
    });

    describe('that uses dynamic imports', () => {
      it('grabs the dynamic import', async() => {
        const fixture = await read('es6DynamicImport.js');
        const result = precinct(fixture);
        assert.equal(result[0], './bar');
      });
    });
  });

  it('handles the esm extension', async() => {
    const fixture = await read('es6.esm');
    const result = precinct(fixture);
    assert.equal(result.includes('lib'), true);
    assert.equal(result.length, 1);
  });

  it('handles the mjs extension', async() => {
    const fixture = await read('es6.mjs');
    const result = precinct(fixture);
    assert.equal(result.includes('lib'), true);
    assert.equal(result.length, 1);
  });
});
