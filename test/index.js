var precinct = require('../'),
    assert = require('assert');


var amd  = precinct(__dirname + '/amd.js');
var cjs  = precinct(__dirname + '/commonjs.js');
var none = precinct(__dirname + '/none.js');

assert(amd.indexOf('./a') !== -1);
assert(amd.indexOf('./b') !== -1);
assert(amd.length === 2);

assert(cjs.indexOf('./a') !== -1);
assert(cjs.indexOf('./b') !== -1);
assert(cjs.length === 2);

assert(none.length === 0);
