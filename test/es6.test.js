import { describe, it, expect } from 'vitest';
import precinct from '../index.js';
import { fixturePath, readFixture } from './helpers.js';

describe('ES6', () => {
  it('grabs dependencies', async() => {
    const fixture = await readFixture('es6.js');
    const result = precinct(fixture);
    expect(result).toStrictEqual(['lib']);
  });

  it('grabs dependencies with embedded jsx', async() => {
    const fixture = await readFixture('jsx.js');
    const result = precinct(fixture);
    expect(result).toStrictEqual(['lib']);
  });

  it('grabs dependencies with embedded es7', async() => {
    const fixture = await readFixture('es7.js');
    const result = precinct(fixture);
    expect(result).toStrictEqual(['lib']);
  });

  it('handles the esm extension', () => {
    const fixture = fixturePath('es6.esm');
    const result = precinct.paperwork(fixture);
    expect(result).toStrictEqual(['lib']);
  });

  it('handles the mjs extension', () => {
    const fixture = fixturePath('es6.mjs');
    const result = precinct.paperwork(fixture);
    expect(result).toStrictEqual(['lib']);
  });

  it('yields no dependencies when there are no imports', async() => {
    const fixture = await readFixture('es6NoImport.js');
    const result = precinct(fixture);
    expect(result).toStrictEqual([]);
  });

  it('does not grab dependencies when there are syntax errors', async() => {
    const fixture = await readFixture('es6WithError.js');
    const result = precinct(fixture);
    expect(result).toStrictEqual([]);
  });

  it('grabs dynamic imports', async() => {
    const fixture = await readFixture('es6DynamicImport.js');
    const result = precinct(fixture);
    expect(result[0]).toBe('./bar');
  });

  it('mixed imports: returns both commonjs and es6 dependencies for es6 files', async() => {
    const fixture = await readFixture('es6MixedImport.js');
    const result = precinct(fixture, {
      es6: {
        mixedImports: true
      }
    });
    expect(result).toHaveLength(2);
  });

  it('mixed imports: returns both commonjs and es6 dependencies for cjs files', async() => {
    const fixture = await readFixture('cjsMixedImport.js');
    const result = precinct(fixture, {
      es6: {
        mixedImports: true
      }
    });
    expect(result).toHaveLength(2);
  });

  it('mixed imports: grabs lazy cjs exports when mixedImports is enabled', async() => {
    const fixture = await readFixture('es6MixedExportLazy.js');
    const result = precinct(fixture, {
      es6: {
        mixedImports: true
      }
    });
    expect(result).toStrictEqual(['./amd', './es6', './es7']);
  });

  it('mixed imports: does not grab lazy cjs exports when mixedImports is disabled', async() => {
    const fixture = await readFixture('es6MixedExportLazy.js');
    const result = precinct(fixture);
    expect(result).toStrictEqual([]);
  });

  it('node: prefix: assumes node:-prefixed builtins exist', () => {
    const fixture = fixturePath('internalNodePrefix.js');
    const result = precinct.paperwork(fixture, { includeCore: false });
    expect(result).toStrictEqual(['streams']);
  });

  it('node: prefix: does not filter out node:-prefixed builtins by default', () => {
    const fixture = fixturePath('nodeBuiltinPrefix.js');
    const result = precinct.paperwork(fixture);
    expect(result).toContain('node:fs');
    expect(result).toContain('node:path');
  });

  it('node: prefix: understands quirks around modules only addressable via node: prefix', () => {
    const fixture = fixturePath('requiretest.js');
    const result = precinct.paperwork(fixture, { includeCore: false });
    expect(result).toStrictEqual(['test']);
  });

  it('node: prefix: filters out node:-prefixed builtins when includeCore is false', () => {
    const fixture = fixturePath('nodeBuiltinPrefix.js');
    const result = precinct.paperwork(fixture, { includeCore: false });
    expect(result).toStrictEqual(['./myModule']);
  });
});
