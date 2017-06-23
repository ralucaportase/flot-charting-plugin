/* jshint node: true*/

"use strict";

var literate = require('ljs');
var fs = require('fs');

var docs2generate = [
  ['HistoryBuffer.md', 'jquery.flot.historybuffer.js'],
];

docs2generate.forEach(function (doc) {
  console.log(doc[0], '...');
  var documentation = literate(doc[1], {
    code: false
  });

  fs.writeFileSync(doc[0], documentation);
});
