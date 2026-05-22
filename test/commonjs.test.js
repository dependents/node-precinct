import { describe, it, expect } from 'vitest';
import precinct from '../index.js';
import { readFixture } from './helpers.js';

describe('CommonJS', () => {
  it('grabs dependencies', async() => {
    const fixture = await readFixture('commonjs.js');
    const result = precinct(fixture);
    expect(result.includes('./a')).toBe(true);
    expect(result.includes('./b')).toBe(true);
    expect(result.length).toBe(2);
    expect(precinct(fixture, { type: 'cjs' })).toStrictEqual(result);
  });

  it('grabs lazy exported dependencies', async() => {
    const fixture = await readFixture('cjsExportLazy.js');
    const result = precinct(fixture);
    expect(result[0]).toBe('./amd');
    expect(result[1]).toBe('./es6');
    expect(result[2]).toBe('./es7');
    expect(result.length).toBe(3);
  });

  it('grabs dependencies when a main require is used', async() => {
    const fixture = await readFixture('commonjs-requiremain.js');
    const result = precinct(fixture);
    expect(result[0]).toBe('./b');
    expect(result.length).toBe(1);
  });

  it('yields no dependencies for non-modules', async() => {
    const fixture = await readFixture('none.js');
    const result = precinct(fixture);
    expect(result.length).toBe(0);
  });

  it('ignores unparsable .js files', async() => {
    const fixture = await readFixture('unparseable.js');
    const result = precinct(fixture);
    expect(result.includes('lib')).toBe(false);
    expect(result.length).toBe(0);
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
