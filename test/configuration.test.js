import { describe, it, expect } from 'vitest';
import parser from '@babel/parser';
import precinct from '../index.js';
import { fixturePath, readFixture } from './helpers.js';

describe('configuration', () => {
  it('passes amd config to the amd detective', async() => {
    const fixture = await readFixture('amdLazy.js');
    const withLazy = precinct(fixture);
    const withoutLazy = precinct(fixture, {
      amd: {
        skipLazyLoaded: true
      }
    });
    expect(withLazy.includes('./b')).toBe(true);
    expect(withoutLazy.includes('./b')).toBe(false);
  });

  it('supports the object form of type configuration', async() => {
    const fixture = await readFixture('styles.styl');
    const result = precinct(fixture, { type: 'stylus' });
    const expected = ['mystyles', 'styles2.styl', 'styles3.styl', 'styles4'];
    expect(result).toStrictEqual(expected);
  });

  it('walker options: finds imports inside blocks when allowImportExportEverywhere is enabled', async() => {
    const fixture = await readFixture('es6ImportInsideBlock.js');
    const withoutOption = precinct(fixture);
    expect(withoutOption.length).toBe(0);

    const withOption = precinct(fixture, {
      walker: {
        allowImportExportEverywhere: true
      }
    });
    expect(withOption.includes('lib')).toBe(true);
    expect(withOption.length).toBe(1);
  });

  it('walker options: accepts a custom parser via walker options', async() => {
    const fixture = await readFixture('commonjs.js');

    const prebuiltAst = parser.parse(fixture, {
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
    expect(parseCallCount).toBe(1);
    expect(result.includes('./a')).toBe(true);
  });

  it('walker options: passes walker options through paperwork', () => {
    const fixture = fixturePath('es6ImportInsideBlock.js');
    const withoutOption = precinct.paperwork(fixture);
    expect(withoutOption.length).toBe(0);

    const withOption = precinct.paperwork(fixture, {
      walker: {
        allowImportExportEverywhere: true
      }
    });
    expect(withOption.includes('lib')).toBe(true);
    expect(withOption.length).toBe(1);
  });
});
