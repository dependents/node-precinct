import { strict as assert } from 'node:assert';
import { suite } from 'uvu';
import precinct from '../index.js';
import { fixturePath, readFixture } from './helpers.js';

const test = suite('stylesheets');

test('grabs dependencies of css files', async() => {
  const fixture = await readFixture('styles.css');
  const result = precinct(fixture, { type: 'css' });
  assert.deepEqual(result, ['foo.css', 'baz.css', 'bla.css', 'another.css']);
});

test('grabs dependencies of scss files', async() => {
  const fixture = await readFixture('styles.scss');
  const result = precinct(fixture, { type: 'scss' });
  assert.deepEqual(result, ['_foo', 'baz.scss']);
});

test('grabs dependencies of sass files', async() => {
  const fixture = await readFixture('styles.sass');
  const result = precinct(fixture, { type: 'sass' });
  assert.deepEqual(result, ['_foo']);
});

test('grabs dependencies of stylus files', () => {
  const fixture = fixturePath('styles.styl');
  const result = precinct.paperwork(fixture);
  const expected = ['mystyles', 'styles2.styl', 'styles3.styl', 'styles4'];
  assert.deepEqual(result, expected);
});

test('grabs dependencies of less files', async() => {
  const fixture = await readFixture('styles.less');
  const result = precinct(fixture, { type: 'less' });
  const expected = ['_foo', '_bar.css', 'baz.less'];
  assert.deepEqual(result, expected);
});

test.run();
