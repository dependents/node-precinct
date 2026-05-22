import { describe, it, expect } from 'vitest';
import precinct from '../index.js';
import { readFixture } from './helpers.js';

describe('AMD', () => {
  it('grabs dependencies', async() => {
    const fixture = await readFixture('amd.js');
    const result = precinct(fixture);
    expect(result).toStrictEqual(['./a', './b']);
  });
});
