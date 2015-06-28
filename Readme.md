### Precinct [![npm](http://img.shields.io/npm/v/precinct.svg)](https://npmjs.org/package/precinct) [![npm](http://img.shields.io/npm/dm/precinct.svg)](https://npmjs.org/package/precinct)

> Unleash the detectives

`npm install precinct`

Uses the appropriate detective to find the dependencies of a file or its AST.

Supports:

* JavaScript modules: AMD, CommonJS, and ES6.
* Sass dependencies via [detective-sass](https://github.com/mrjoelkemp/node-detective-sass).
* Stylus

### Usage

```js
var precinct = require('precinct');

var content = fs.readFileSync('myFile.js', 'utf8');

// Pass in a file's content or an AST
var deps = precinct(content);
```

Finding non-JavaScript (ex: Sass and Stylus) dependencies:

```js
var content = fs.readFileSync('styles.scss', 'utf8');

var deps = precinct(content, 'sass');
var deps2 = precinct(content, 'stylus');
```

Or, if you just want to pass in a filepath and get the dependencies:

```js
var paperwork = require('precinct').paperwork;

var deps = paperwork('myFile.js');
var deps2 = paperwork('styles.scss');
```

###### `precinct.paperwork(filename, options)`

* `includeCore`: (default: true) set to `false` to exclude core Node dependencies from the list of dependencies.

### License

MIT
