/* eslint-env mocha */

'use strict';

const assert = require('assert').strict;
const { readFile } = require('fs/promises');
const path = require('path');
const precinct = require('../index.js');
const ast = require('./fixtures/exampleAST.js');

function fixturePath(filename) {
  return path.join(__dirname, 'fixtures', filename);
}

async function read(filename) {
  return readFile(fixturePath(filename), 'utf8');
}

describe('node-precinct', () => {
  describe('AST', () => {
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
  });

  describe('AMD', () => {
    it('grabs dependencies', async() => {
      const fixture = await read('amd.js');
      const result = precinct(fixture);
      assert.equal(result.includes('./a'), true);
      assert.equal(result.includes('./b'), true);
      assert.equal(result.length, 2);
    });
  });

  describe('CommonJS', () => {
    it('grabs dependencies', async() => {
      const fixture = await read('commonjs.js');
      const result = precinct(fixture);
      assert.equal(result.includes('./a'), true);
      assert.equal(result.includes('./b'), true);
      assert.equal(result.length, 2);
      assert.deepEqual(precinct(fixture, { type: 'cjs' }), result);
    });

    it('grabs lazy exported dependencies', async() => {
      const fixture = await read('cjsExportLazy.js');
      const result = precinct(fixture);
      assert.equal(result[0], './amd');
      assert.equal(result[1], './es6');
      assert.equal(result[2], './es7');
      assert.equal(result.length, 3);
    });

    it('grabs dependencies when a main require is used', async() => {
      const fixture = await read('commonjs-requiremain.js');
      const result = precinct(fixture);
      assert.equal(result[0], './b');
      assert.equal(result.length, 1);
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
  });

  describe('ES6', () => {
    it('grabs dependencies', async() => {
      const fixture = await read('es6.js');
      const result = precinct(fixture);
      assert.equal(result.includes('lib'), true);
      assert.equal(result.length, 1);
    });

    it('grabs dependencies with embedded jsx', async() => {
      const fixture = await read('jsx.js');
      const result = precinct(fixture);
      assert.equal(result.includes('lib'), true);
      assert.equal(result.length, 1);
    });

    it('grabs dependencies with embedded es7', async() => {
      const fixture = await read('es7.js');
      const result = precinct(fixture);
      assert.equal(result.includes('lib'), true);
      assert.equal(result.length, 1);
    });

    it('handles the esm extension', () => {
      const fixture = fixturePath('es6.esm');
      const result = precinct.paperwork(fixture);
      assert.equal(result.includes('lib'), true);
      assert.equal(result.length, 1);
    });

    it('handles the mjs extension', () => {
      const fixture = fixturePath('es6.mjs');
      const result = precinct.paperwork(fixture);
      assert.equal(result.includes('lib'), true);
      assert.equal(result.length, 1);
    });

    it('yields no dependencies when there are no imports', async() => {
      const fixture = await read('es6NoImport.js');
      const result = precinct(fixture);
      assert.equal(result.length, 0);
    });

    it('does not grab dependencies when there are syntax errors', async() => {
      const fixture = await read('es6WithError.js');
      const result = precinct(fixture);
      assert.equal(result.length, 0);
    });

    it('grabs dynamic imports', async() => {
      const fixture = await read('es6DynamicImport.js');
      const result = precinct(fixture);
      assert.equal(result[0], './bar');
    });

    describe('mixed imports', () => {
      it('returns both commonjs and es6 dependencies for es6 files', async() => {
        const fixture = await read('es6MixedImport.js');
        const result = precinct(fixture, {
          es6: {
            mixedImports: true
          }
        });
        assert.equal(result.length, 2);
      });

      it('returns both commonjs and es6 dependencies for cjs files', async() => {
        const fixture = await read('cjsMixedImport.js');
        const result = precinct(fixture, {
          es6: {
            mixedImports: true
          }
        });
        assert.equal(result.length, 2);
      });

      it('grabs lazy cjs exports when mixedImports is enabled', async() => {
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

      it('does not grab lazy cjs exports when mixedImports is disabled', async() => {
        const fixture = await read('es6MixedExportLazy.js');
        const result = precinct(fixture);
        assert.equal(result.length, 0);
      });
    });

    describe('node: prefix', () => {
      it('assumes node:-prefixed builtins exist', () => {
        const fixture = fixturePath('internalNodePrefix.js');
        const result = precinct.paperwork(fixture, { includeCore: false });
        assert.equal(result.includes('node:nonexistant'), false);
        assert.deepEqual(result, ['streams']);
      });

      it('does not filter out node:-prefixed builtins by default', () => {
        const fixture = fixturePath('nodeBuiltinPrefix.js');
        const result = precinct.paperwork(fixture);
        assert.ok(result.includes('node:fs'));
        assert.ok(result.includes('node:path'));
      });

      it('understands quirks around modules only addressable via node: prefix', () => {
        const fixture = fixturePath('requiretest.js');
        const result = precinct.paperwork(fixture, { includeCore: false });
        assert.deepEqual(result, ['test']);
      });

      it('filters out node:-prefixed builtins when includeCore is false', () => {
        const fixture = fixturePath('nodeBuiltinPrefix.js');
        const result = precinct.paperwork(fixture, { includeCore: false });
        assert.deepEqual(result, ['./myModule']);
      });
    });
  });

  describe('stylesheets', () => {
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

    it('grabs dependencies of stylus files', () => {
      const fixture = fixturePath('styles.styl');
      const result = precinct.paperwork(fixture);
      const expected = ['mystyles', 'styles2.styl', 'styles3.styl', 'styles4'];
      assert.deepEqual(result, expected);
    });

    it('grabs dependencies of less files', async() => {
      const fixture = await read('styles.less');
      const result = precinct(fixture, { type: 'less' });
      const expected = ['_foo', '_bar.css', 'baz.less'];
      assert.deepEqual(result, expected);
    });
  });

  describe('TypeScript', () => {
    it('grabs dependencies of ts files', async() => {
      const fixture = await read('typescript.ts');
      const result = precinct(fixture, { type: 'ts' });
      const expected = ['fs', 'lib', './bar', './my-module.js', './ZipCodeValidator'];
      assert.deepEqual(result, expected);
    });

    it('grabs dependencies of tsx files', async() => {
      const fixture = await read('module.tsx');
      const result = precinct(fixture, { type: 'tsx' });
      const expected = ['./none'];
      assert.deepEqual(result, expected);
    });

    it('does not grab dependencies when there are syntax errors', async() => {
      const fixture = await read('typescriptWithError.ts');
      const result = precinct(fixture);
      assert.equal(result.length, 0);
    });
  });

  describe('Vue', () => {
    it('grabs dependencies from typescript/scss files', () => {
      const vueFile = precinct.paperwork(fixturePath('ts.vue'));
      assert.equal(vueFile[0], './typescript');
      assert.equal(vueFile[1], 'styles.scss');
      assert.equal(vueFile.length, 2);
    });

    it('grabs dependencies from javascript/sass files', () => {
      const vueFile = precinct.paperwork(fixturePath('js.vue'));
      assert.equal(vueFile[0], './typescript');
      assert.equal(vueFile[1], 'styles.scss');
      assert.equal(vueFile.length, 2);
    });
  });

  describe('configuration', () => {
    it('passes amd config to the amd detective', async() => {
      const fixture = await read('amdLazy.js');
      const withLazy = precinct(fixture);
      const withoutLazy = precinct(fixture, {
        amd: {
          skipLazyLoaded: true
        }
      });
      assert.equal(withLazy.includes('./b'), true);
      assert.equal(withoutLazy.includes('./b'), false);
    });

    it('supports the object form of type configuration', async() => {
      const fixture = await read('styles.styl');
      const result = precinct(fixture, { type: 'stylus' });
      const expected = ['mystyles', 'styles2.styl', 'styles3.styl', 'styles4'];
      assert.deepEqual(result, expected);
    });

    describe('walker options', () => {
      it('finds imports inside blocks when allowImportExportEverywhere is enabled', async() => {
        // By default babel disallows import/export outside the top level, so
        // a file with an import inside an if-block yields no dependencies.
        const fixture = await read('es6ImportInsideBlock.js');
        const withoutOption = precinct(fixture);
        assert.equal(withoutOption.length, 0);

        // With allowImportExportEverywhere the same file is parsed correctly.
        const withOption = precinct(fixture, {
          walker: {
            allowImportExportEverywhere: true
          }
        });
        assert.equal(withOption.includes('lib'), true);
        assert.equal(withOption.length, 1);
      });

      it('accepts a custom parser via walker options', async() => {
        const fixture = await read('commonjs.js');

        // Parse the AST up-front - the custom parser below returns it directly
        // without invoking Babel, demonstrating that any object with a parse()
        // method can be supplied, not just @babel/parser.
        const prebuiltAst = require('@babel/parser').parse(fixture, {
          sourceType: 'module',
          allowHashBang: true
        });

        let parseCallCount = 0;
        const customParser = {
          parse() {
            parseCallCount++;
            return prebuiltAst;
          }
        };

        const result = precinct(fixture, {
          walker: {
            parser: customParser
          }
        });
        assert.equal(parseCallCount, 1);
        assert.equal(result.includes('./a'), true);
      });

      it('passes walker options through paperwork', () => {
        const fixture = fixturePath('es6ImportInsideBlock.js');
        const withoutOption = precinct.paperwork(fixture);
        assert.equal(withoutOption.length, 0);

        const withOption = precinct.paperwork(fixture, {
          walker: {
            allowImportExportEverywhere: true
          }
        });
        assert.equal(withOption.includes('lib'), true);
        assert.equal(withOption.length, 1);
      });
    });
  });

  describe('paperwork', () => {
    it('grabs dependencies of jsx files', () => {
      const fixture = fixturePath('module.jsx');
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
        const result = precinct.paperwork(fixturePath(fixture));
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
      const fixture = fixturePath('coreModules.js');
      const result = precinct.paperwork(fixture, { includeCore: false });
      assert.equal(result.length, 0);
    });

    it('does not filter out core modules by default', () => {
      const fixture = fixturePath('coreModules.js');
      const result = precinct.paperwork(fixture);
      assert.notEqual(result.length, 0);
    });

    it('handles cjs files as commonjs', () => {
      const fixture = fixturePath('commonjs.cjs');
      const result = precinct.paperwork(fixture);
      assert.equal(result.includes('./a'), true);
      assert.equal(result.includes('./b'), true);
    });

    it('passes detective configuration to the underlying detective', () => {
      const fixture = fixturePath('amdLazy.js');
      const withLazy = precinct.paperwork(fixture);
      const withoutLazy = precinct.paperwork(fixture, {
        amd: {
          skipLazyLoaded: true
        }
      });
      assert.equal(withLazy.includes('./b'), true);
      assert.equal(withoutLazy.includes('./b'), false);
    });

    it('does not filter out core modules by default when given detective configuration', () => {
      const fixture = fixturePath('coreModules.js');
      const result = precinct.paperwork(fixture, {
        amd: {
          skipLazyLoaded: true
        }
      });
      assert.notEqual(result.length, 0);
    });
  });
});
