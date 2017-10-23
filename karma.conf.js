// Karma configuration
// Generated on Wed Jun 15 2016 09:05:44 GMT-0500 (CDT)

var module;

module.exports = function (config) {
    'use strict';

    var browsersMatrix = {
            'win': ['Firefox', 'Chrome', 'Edge'],
            'linux': ['Firefox', 'Chrome'],
            'mac': ['Safari', 'Firefox', 'Chrome']
        },
        isWin = /^win/.test(process.platform),
        isLinux = /^linux/.test(process.platform),
        isMac = /^darwin/.test(process.platform),
        currentOSType = isWin ? 'win' : (isLinux ? 'linux' : 'mac'),
        currentOSBrowsers = browsersMatrix[currentOSType];

    var coverage_sources = [
        'jquery.flot.historybuffer.js',
        'jquery.flot.segment-tree.js',
        'jquery.flot.historybuffer.numeric.js',
        'jquery.flot.historybuffer.analogWaveform.js',
        'jquery.flot.charting.js'
    ];

    var sources = [
        'lib/cbuffer.js',
        'jquery.js',
        'node_modules/ni-data-types/sources/niTimeStamp.js',
        'node_modules/ni-data-types/sources/niAnalogWaveform.js',
        'node_modules/engineering-flot/dist/es5/jquery.flot.js',
        'lib/jsverify.standalone.js',
        'lib/jasmineHelpers2.js',
    ].concat(coverage_sources);

    var settings = {
        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '',

        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jasmine-jquery', 'jasmine'],

        // list of files / patterns to load in the browser

        files: sources.concat([
            'spec/*.Test.js',
        ]),

        // list of files to exclude
        exclude: [],

        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {},

        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['kjhtml', 'spec'],

        coverageReporter: {
            type: 'lcov', // lcov or lcovonly are required for generating lcov.info files
            dir: 'coverage/'
        },

        // web server port
        port: 9876,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,

        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: currentOSBrowsers,


        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: false,

        // Concurrency level
        // how many browser should be started simultaneous
        concurrency: Infinity
    };

    if (config.coverage) {
        coverage_sources.forEach(function (pattern) {
            if (!settings.preprocessors[pattern]) {
                settings.preprocessors[pattern] = ['coverage'];
            } else {
                settings.preprocessors[pattern].push('coverage');
            }
        });

        settings.reporters.push('coverage');
        settings.reporters.push('coveralls');
    }

    config.set(settings);
};
