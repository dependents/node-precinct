import { describe, it, expect } from 'vitest';
import precinct from '../index.js';
import ast from './fixtures/exampleAST.js';
import { readFixture } from './helpers.js';

describe('AST', () => {
  it('accepts an AST', () => {
    const deps = precinct(ast);
    expect(deps.length).toBe(1);
  });

  it('dangles off a given ast', () => {
    expect(precinct.ast).toStrictEqual(ast);
  });

  it('dangles off the parsed ast from a .js file', async() => {
    const fixture = await readFixture('amd.js');
    precinct(fixture);
    expect(precinct.ast).not.toBe(null);
    expect(precinct.ast).not.toStrictEqual(ast);
  });

  it('dangles off the parsed ast from a scss detective', async() => {
    const fixture = await readFixture('styles.scss');
    precinct(fixture, { type: 'scss' });
    expect(precinct.ast).not.toStrictEqual({});
  });

  it('dangles off the parsed ast from a sass detective', async() => {
    const fixture = await readFixture('styles.sass');
    precinct(fixture, { type: 'sass' });
    expect(precinct.ast).not.toStrictEqual({});
  });
});
