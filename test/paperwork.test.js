import { describe, it, expect } from 'vitest';
import precinct from '../index.js';
import { fixturePath } from './helpers.js';

describe('paperwork', () => {
  it('grabs dependencies of jsx files', () => {
    const fixture = fixturePath('module.jsx');
    const result = precinct.paperwork(fixture);
    const expected = ['./es6NoImport'];
    expect(result).toStrictEqual(expected);
  });

  it('uses fileSystem from options if provided', () => {
    const fsMock = {
      readFileSync(filePath) {
        expect(filePath).toBe('/foo.js');
        return 'var assert = require("assert");';
      }
    };

    const fixture = '/foo.js';
    const results = precinct.paperwork(fixture, { fileSystem: fsMock });
    expect(results).toStrictEqual(['assert']);
  });

  it('returns the dependencies for the given filepath', () => {
    const fixtures = ['es6.js', 'styles.scss', 'typescript.ts', 'styles.css'];

    for (const fixture of fixtures) {
      const result = precinct.paperwork(fixturePath(fixture));
      expect(result.length).toBeGreaterThan(0);
    }
  });

  it('throws if the file cannot be found', () => {
    expect(() => {
      precinct.paperwork('foo');
    }).toThrow();
  });

  it('filters out core modules if options.includeCore is false', () => {
    const fixture = fixturePath('coreModules.js');
    const result = precinct.paperwork(fixture, { includeCore: false });
    expect(result).toStrictEqual([]);
  });

  it('does not filter out core modules by default', () => {
    const fixture = fixturePath('coreModules.js');
    const result = precinct.paperwork(fixture);
    expect(result.length).toBeGreaterThan(0);
  });

  it('handles cjs files as commonjs', () => {
    const fixture = fixturePath('commonjs.cjs');
    const result = precinct.paperwork(fixture);
    expect(result).toContain('./a');
    expect(result).toContain('./b');
  });

  it('passes detective configuration to the underlying detective', () => {
    const fixture = fixturePath('amdLazy.js');
    const withLazy = precinct.paperwork(fixture);
    const withoutLazy = precinct.paperwork(fixture, {
      amd: {
        skipLazyLoaded: true
      }
    });
    expect(withLazy.includes('./b')).toBe(true);
    expect(withoutLazy.includes('./b')).toBe(false);
  });

  it('does not filter out core modules by default when given detective configuration', () => {
    const fixture = fixturePath('coreModules.js');
    const result = precinct.paperwork(fixture, {
      amd: {
        skipLazyLoaded: true
      }
    });
    expect(result.length).toBeGreaterThan(0);
  });
});
