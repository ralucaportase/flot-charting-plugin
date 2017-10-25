/* eslint-disable */

var args = process.argv.slice(2);
var fs = require('fs');
var concat = require('concat');
var tmp = require('tmp');

var distDir = './dist/es5';
var distFile = 'jquery.flot.charting.js';

if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir)
}

function concatenateFiles(destinationPath, callback) {
    concat([
        './lib/cbuffer.js',
        './jquery.flot.segment-tree.js',
        './jquery.flot.historybuffer.numeric.js',
        './jquery.flot.historybuffer.analogWaveform.js',
        './jquery.flot.historybuffer.js',
        './jquery.flot.charting.js'
    ], destinationPath);
}

if (args[0] === 'test') {
    console.log('testing distribution ...');
    var tmpobj = tmp.fileSync();
    concatenateFiles(tmpobj.name, function(err, result) {
            var origBuild = fs.readFileSync(distDir + '/' + distFile, 'utf8');
            var newBuild = fs.readFileSync(tmpobj.name, 'utf8');

            if (newBuild !== origBuild) {
                console.log('The distribution file dist/es5/jquery.flot.js is not up to date. Type "npm run build" to fix it !');
                process.exitCode = 1;
                return;
            }

            console.log('Ok');
        });
    }  else {
        console.log('building ', distDir + '/' + distFile);
        concatenateFiles(distDir + '/' + distFile);
    }
