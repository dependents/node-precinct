import { describe, it, expect } from 'vitest';
import precinct from '../index.js';
import { fixturePath, readFixture } from './helpers.js';

describe('stylesheets', () => {
  it('grabs dependencies of css files', async() => {
    const fixture = await readFixture('styles.css');
    const result = precinct(fixture, { type: 'css' });
    expect(result).toStrictEqual(['foo.css', 'baz.css', 'bla.css', 'another.css']);
  });

  it('grabs dependencies of scss files', async() => {
    const fixture = await readFixture('styles.scss');
    const result = precinct(fixture, { type: 'scss' });
    expect(result).toStrictEqual(['_foo', 'baz.scss']);
  });

  it('grabs dependencies of sass files', async() => {
    const fixture = await readFixture('styles.sass');
    const result = precinct(fixture, { type: 'sass' });
    expect(result).toStrictEqual(['_foo']);
  });

  it('grabs dependencies of stylus files', () => {
    const fixture = fixturePath('styles.styl');
    const result = precinct.paperwork(fixture);
    const expected = ['mystyles', 'styles2.styl', 'styles3.styl', 'styles4'];
    expect(result).toStrictEqual(expected);
  });

  it('grabs dependencies of less files', async() => {
    const fixture = await readFixture('styles.less');
    const result = precinct(fixture, { type: 'less' });
    const expected = ['_foo', '_bar.css', 'baz.less'];
    expect(result).toStrictEqual(expected);
  });
});
