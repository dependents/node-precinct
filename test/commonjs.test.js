import { describe, it, expect } from 'vitest';
import precinct from '../index.js';
import { readFixture } from './helpers.js';

describe('CommonJS', () => {
  it('grabs dependencies', async() => {
    const fixture = await readFixture('commonjs.js');
    const result = precinct(fixture);
    expect(result).toStrictEqual(['./a', './b']);
    expect(precinct(fixture, { type: 'cjs' })).toStrictEqual(result);
  });

  it('grabs lazy exported dependencies', async() => {
    const fixture = await readFixture('cjsExportLazy.js');
    const result = precinct(fixture);
    expect(result).toStrictEqual(['./amd', './es6', './es7']);
  });

  it('grabs dependencies when a main require is used', async() => {
    const fixture = await readFixture('commonjs-requiremain.js');
    const result = precinct(fixture);
    expect(result).toStrictEqual(['./b']);
  });

  it('yields no dependencies for non-modules', async() => {
    const fixture = await readFixture('none.js');
    const result = precinct(fixture);
    expect(result).toStrictEqual([]);
  });

  it('ignores unparsable .js files', async() => {
    const fixture = await readFixture('unparseable.js');
    const result = precinct(fixture);
    expect(result).toStrictEqual([]);
  });

  it('does not throw on unparsable .js files', async() => {
    const fixture = await readFixture('unparseable.js');
    expect(() => {
      precinct(fixture);
    }).not.toThrow();
  });

  it('does not blow up when parsing a gruntfile #2', async() => {
    const fixture = await readFixture('Gruntfile.js');
    expect(() => {
      precinct(fixture);
    }).not.toThrow();
  });
});
