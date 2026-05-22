import { describe, it, expect } from 'vitest';
import precinct from '../index.js';
import { readFixture } from './helpers.js';

describe('TypeScript', () => {
  it('grabs dependencies of ts files', async() => {
    const fixture = await readFixture('typescript.ts');
    const result = precinct(fixture, { type: 'ts' });
    const expected = ['fs', 'lib', './bar', './my-module.js', './ZipCodeValidator'];
    expect(result).toStrictEqual(expected);
  });

  it('grabs dependencies of tsx files', async() => {
    const fixture = await readFixture('module.tsx');
    const result = precinct(fixture, { type: 'tsx' });
    const expected = ['./none'];
    expect(result).toStrictEqual(expected);
  });

  it('does not grab dependencies when there are syntax errors', async() => {
    const fixture = await readFixture('typescriptWithError.ts');
    const result = precinct(fixture);
    expect(result).toStrictEqual([]);
  });
});
