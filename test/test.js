'use strict';

const assert = require('assert').strict;
const { readFile } = require('fs/promises');
const path = require('path');
const { suite } = require('uvu');
const precinct = require('../index.js');
const ast = require('./fixtures/exampleAST.js');

function fixturePath(filename) {
  return path.join(__dirname, 'fixtures', filename);
}

async function read(filename) {
  return readFile(fixturePath(filename), 'utf8');
}

const astTests = suite('node-precinct / AST');

astTests('accepts an AST', () => {
  const deps = precinct(ast);
  assert.equal(deps.length, 1);
});

astTests('dangles off a given ast', () => {
  assert.deepEqual(precinct.ast, ast);
});

astTests('dangles off the parsed ast from a .js file', async() => {
  const fixture = await read('amd.js');
  precinct(fixture);
  assert.ok(precinct.ast);
  assert.notDeepEqual(precinct.ast, ast);
});

astTests('dangles off the parsed ast from a scss detective', async() => {
  const fixture = await read('styles.scss');
  precinct(fixture, { type: 'scss' });
  assert.notDeepEqual(precinct.ast, {});
});

astTests('dangles off the parsed ast from a sass detective', async() => {
  const fixture = await read('styles.sass');
  precinct(fixture, { type: 'sass' });
  assert.notDeepEqual(precinct.ast, {});
});

astTests.run();

const amdTests = suite('node-precinct / AMD');

amdTests('grabs dependencies', async() => {
  const fixture = await read('amd.js');
  const result = precinct(fixture);
  assert.equal(result.includes('./a'), true);
  assert.equal(result.includes('./b'), true);
  assert.equal(result.length, 2);
});

amdTests.run();

const commonjsTests = suite('node-precinct / CommonJS');

commonjsTests('grabs dependencies', async() => {
  const fixture = await read('commonjs.js');
  const result = precinct(fixture);
  assert.equal(result.includes('./a'), true);
  assert.equal(result.includes('./b'), true);
  assert.equal(result.length, 2);
  assert.deepEqual(precinct(fixture, { type: 'cjs' }), result);
});

commonjsTests('grabs lazy exported dependencies', async() => {
  const fixture = await read('cjsExportLazy.js');
  const result = precinct(fixture);
  assert.equal(result[0], './amd');
  assert.equal(result[1], './es6');
  assert.equal(result[2], './es7');
  assert.equal(result.length, 3);
});

commonjsTests('grabs dependencies when a main require is used', async() => {
  const fixture = await read('commonjs-requiremain.js');
  const result = precinct(fixture);
  assert.equal(result[0], './b');
  assert.equal(result.length, 1);
});

commonjsTests('yields no dependencies for non-modules', async() => {
  const fixture = await read('none.js');
  const result = precinct(fixture);
  assert.equal(result.length, 0);
});

commonjsTests('ignores unparsable .js files', async() => {
  const fixture = await read('unparseable.js');
  const result = precinct(fixture);
  assert.equal(result.includes('lib'), false);
  assert.equal(result.length, 0);
});

commonjsTests('does not throw on unparsable .js files', async() => {
  const fixture = await read('unparseable.js');
  assert.doesNotThrow(() => {
    precinct(fixture);
  }, SyntaxError);
});

commonjsTests('does not blow up when parsing a gruntfile #2', async() => {
  const fixture = await read('Gruntfile.js');
  assert.doesNotThrow(() => {
    precinct(fixture);
  });
});

commonjsTests.run();

const es6Tests = suite('node-precinct / ES6');

es6Tests('grabs dependencies', async() => {
  const fixture = await read('es6.js');
  const result = precinct(fixture);
  assert.equal(result.includes('lib'), true);
  assert.equal(result.length, 1);
});

es6Tests('grabs dependencies with embedded jsx', async() => {
  const fixture = await read('jsx.js');
  const result = precinct(fixture);
  assert.equal(result.includes('lib'), true);
  assert.equal(result.length, 1);
});

es6Tests('grabs dependencies with embedded es7', async() => {
  const fixture = await read('es7.js');
  const result = precinct(fixture);
  assert.equal(result.includes('lib'), true);
  assert.equal(result.length, 1);
});

es6Tests('handles the esm extension', () => {
  const fixture = fixturePath('es6.esm');
  const result = precinct.paperwork(fixture);
  assert.equal(result.includes('lib'), true);
  assert.equal(result.length, 1);
});

es6Tests('handles the mjs extension', () => {
  const fixture = fixturePath('es6.mjs');
  const result = precinct.paperwork(fixture);
  assert.equal(result.includes('lib'), true);
  assert.equal(result.length, 1);
});

es6Tests('yields no dependencies when there are no imports', async() => {
  const fixture = await read('es6NoImport.js');
  const result = precinct(fixture);
  assert.equal(result.length, 0);
});

es6Tests('does not grab dependencies when there are syntax errors', async() => {
  const fixture = await read('es6WithError.js');
  const result = precinct(fixture);
  assert.equal(result.length, 0);
});

es6Tests('grabs dynamic imports', async() => {
  const fixture = await read('es6DynamicImport.js');
  const result = precinct(fixture);
  assert.equal(result[0], './bar');
});

es6Tests('mixed imports: returns both commonjs and es6 dependencies for es6 files', async() => {
  const fixture = await read('es6MixedImport.js');
  const result = precinct(fixture, {
    es6: {
      mixedImports: true
    }
  });
  assert.equal(result.length, 2);
});

es6Tests('mixed imports: returns both commonjs and es6 dependencies for cjs files', async() => {
  const fixture = await read('cjsMixedImport.js');
  const result = precinct(fixture, {
    es6: {
      mixedImports: true
    }
  });
  assert.equal(result.length, 2);
});

es6Tests('mixed imports: grabs lazy cjs exports when mixedImports is enabled', async() => {
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

es6Tests('mixed imports: does not grab lazy cjs exports when mixedImports is disabled', async() => {
  const fixture = await read('es6MixedExportLazy.js');
  const result = precinct(fixture);
  assert.equal(result.length, 0);
});

es6Tests('node: prefix: assumes node:-prefixed builtins exist', () => {
  const fixture = fixturePath('internalNodePrefix.js');
  const result = precinct.paperwork(fixture, { includeCore: false });
  assert.equal(result.includes('node:nonexistant'), false);
  assert.deepEqual(result, ['streams']);
});

es6Tests('node: prefix: does not filter out node:-prefixed builtins by default', () => {
  const fixture = fixturePath('nodeBuiltinPrefix.js');
  const result = precinct.paperwork(fixture);
  assert.ok(result.includes('node:fs'));
  assert.ok(result.includes('node:path'));
});

es6Tests('node: prefix: understands quirks around modules only addressable via node: prefix', () => {
  const fixture = fixturePath('requiretest.js');
  const result = precinct.paperwork(fixture, { includeCore: false });
  assert.deepEqual(result, ['test']);
});

es6Tests('node: prefix: filters out node:-prefixed builtins when includeCore is false', () => {
  const fixture = fixturePath('nodeBuiltinPrefix.js');
  const result = precinct.paperwork(fixture, { includeCore: false });
  assert.deepEqual(result, ['./myModule']);
});

es6Tests.run();

const stylesheetsTests = suite('node-precinct / stylesheets');

stylesheetsTests('grabs dependencies of css files', async() => {
  const fixture = await read('styles.css');
  const result = precinct(fixture, { type: 'css' });
  assert.deepEqual(result, ['foo.css', 'baz.css', 'bla.css', 'another.css']);
});

stylesheetsTests('grabs dependencies of scss files', async() => {
  const fixture = await read('styles.scss');
  const result = precinct(fixture, { type: 'scss' });
  assert.deepEqual(result, ['_foo', 'baz.scss']);
});

stylesheetsTests('grabs dependencies of sass files', async() => {
  const fixture = await read('styles.sass');
  const result = precinct(fixture, { type: 'sass' });
  assert.deepEqual(result, ['_foo']);
});

stylesheetsTests('grabs dependencies of stylus files', () => {
  const fixture = fixturePath('styles.styl');
  const result = precinct.paperwork(fixture);
  const expected = ['mystyles', 'styles2.styl', 'styles3.styl', 'styles4'];
  assert.deepEqual(result, expected);
});

stylesheetsTests('grabs dependencies of less files', async() => {
  const fixture = await read('styles.less');
  const result = precinct(fixture, { type: 'less' });
  const expected = ['_foo', '_bar.css', 'baz.less'];
  assert.deepEqual(result, expected);
});

stylesheetsTests.run();

const typescriptTests = suite('node-precinct / TypeScript');

typescriptTests('grabs dependencies of ts files', async() => {
  const fixture = await read('typescript.ts');
  const result = precinct(fixture, { type: 'ts' });
  const expected = ['fs', 'lib', './bar', './my-module.js', './ZipCodeValidator'];
  assert.deepEqual(result, expected);
});

typescriptTests('grabs dependencies of tsx files', async() => {
  const fixture = await read('module.tsx');
  const result = precinct(fixture, { type: 'tsx' });
  const expected = ['./none'];
  assert.deepEqual(result, expected);
});

typescriptTests('does not grab dependencies when there are syntax errors', async() => {
  const fixture = await read('typescriptWithError.ts');
  const result = precinct(fixture);
  assert.equal(result.length, 0);
});

typescriptTests.run();

const vueTests = suite('node-precinct / Vue');

vueTests('grabs dependencies from typescript/scss files', () => {
  const vueFile = precinct.paperwork(fixturePath('ts.vue'));
  assert.equal(vueFile[0], './typescript');
  assert.equal(vueFile[1], 'styles.scss');
  assert.equal(vueFile.length, 2);
});

vueTests('grabs dependencies from javascript/sass files', () => {
  const vueFile = precinct.paperwork(fixturePath('js.vue'));
  assert.equal(vueFile[0], './typescript');
  assert.equal(vueFile[1], 'styles.scss');
  assert.equal(vueFile.length, 2);
});

vueTests.run();

const configurationTests = suite('node-precinct / configuration');

configurationTests('passes amd config to the amd detective', async() => {
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

configurationTests('supports the object form of type configuration', async() => {
  const fixture = await read('styles.styl');
  const result = precinct(fixture, { type: 'stylus' });
  const expected = ['mystyles', 'styles2.styl', 'styles3.styl', 'styles4'];
  assert.deepEqual(result, expected);
});

configurationTests('walker options: finds imports inside blocks when allowImportExportEverywhere is enabled', async() => {
  const fixture = await read('es6ImportInsideBlock.js');
  const withoutOption = precinct(fixture);
  assert.equal(withoutOption.length, 0);

  const withOption = precinct(fixture, {
    walker: {
      allowImportExportEverywhere: true
    }
  });
  assert.equal(withOption.includes('lib'), true);
  assert.equal(withOption.length, 1);
});

configurationTests('walker options: accepts a custom parser via walker options', async() => {
  const fixture = await read('commonjs.js');

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

configurationTests('walker options: passes walker options through paperwork', () => {
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

configurationTests.run();

const paperworkTests = suite('node-precinct / paperwork');

paperworkTests('grabs dependencies of jsx files', () => {
  const fixture = fixturePath('module.jsx');
  const result = precinct.paperwork(fixture);
  const expected = ['./es6NoImport'];
  assert.deepEqual(result, expected);
});

paperworkTests('uses fileSystem from options if provided', () => {
  const fsMock = {
    readFileSync(filePath) {
      assert.equal(filePath, '/foo.js');
      return 'var assert = require("assert");';
    }
  };

  const fixture = '/foo.js';
  const results = precinct.paperwork(fixture, { fileSystem: fsMock });
  assert.equal(results.length, 1);
  assert.equal(results[0], 'assert');
});

paperworkTests('returns the dependencies for the given filepath', () => {
  const fixtures = ['es6.js', 'styles.scss', 'typescript.ts', 'styles.css'];

  for (const fixture of fixtures) {
    const result = precinct.paperwork(fixturePath(fixture));
    assert.notEqual(result.length, 0);
  }
});

paperworkTests('throws if the file cannot be found', () => {
  const fixture = 'foo';
  assert.throws(() => {
    precinct.paperwork(fixture);
  });
});

paperworkTests('filters out core modules if options.includeCore is false', () => {
  const fixture = fixturePath('coreModules.js');
  const result = precinct.paperwork(fixture, { includeCore: false });
  assert.equal(result.length, 0);
});

paperworkTests('does not filter out core modules by default', () => {
  const fixture = fixturePath('coreModules.js');
  const result = precinct.paperwork(fixture);
  assert.notEqual(result.length, 0);
});

paperworkTests('handles cjs files as commonjs', () => {
  const fixture = fixturePath('commonjs.cjs');
  const result = precinct.paperwork(fixture);
  assert.equal(result.includes('./a'), true);
  assert.equal(result.includes('./b'), true);
});

paperworkTests('passes detective configuration to the underlying detective', () => {
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

paperworkTests('does not filter out core modules by default when given detective configuration', () => {
  const fixture = fixturePath('coreModules.js');
  const result = precinct.paperwork(fixture, {
    amd: {
      skipLazyLoaded: true
    }
  });
  assert.notEqual(result.length, 0);
});

paperworkTests.run();
