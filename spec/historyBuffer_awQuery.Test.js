/* global describe, it, expect, HistoryBuffer */
/* jshint browser: true*/

/* brackets-xunit: includes=../lib/cbuffer.js,../lib/jsverify.standalone.js,../lib/jasmineHelpers2.js,../jquery.flot.historybuffer.js */

describe('A HistoryBufferWaveform', function () {
    'use strict';

    var aw, aw1, aw2, aw3, empty_aw;

    beforeEach(function () {
        aw = new NIAnalogWaveform({
            t0: 4,
            dt: 1,
            Y:[1, 2, 3]
        });

        aw1 = new NIAnalogWaveform({
            t0: 1,
            dt: 1,
            Y:[1, 2, 3]
        });

        aw2 = new NIAnalogWaveform({
            t0: 8,
            dt: 1,
            Y:[4, 3, 2]
        });

        aw2 = new NIAnalogWaveform({
            t0: 10,
            dt: 1,
            Y:[0, 1, 2]
        });

        empty_aw = new NIAnalogWaveform({
            t0: 10,
            dt: 1,
            Y:[]
        });
    });

    it('has a query method', function () {
        var hb = new HistoryBufferWaveform(10);

        expect(hb.query).toEqual(jasmine.any(Function));
    });

    it('has basic query capabilities', function () {
        var hb = new HistoryBufferWaveform(10);

        hb.push(aw);

        expect(hb.query(0, 10, 1)).toEqual([4, 1, 5, 2, 6, 3]);
    });

    it('can deal with empty waveforms', function () {
        var hb = new HistoryBufferWaveform(10);

        hb.appendArray([aw, empty_aw, aw1]);

        expect(hb.query(0, 10, 1)).toEqual([4, 1, 5, 2, 6, 3, null, null, 1, 1, 2, 2, 3, 3]);
    });

    it('has basic query capabilities for buffers with multiple data series', function () {
        var hb = new HistoryBufferWaveform(10, 2);

        hb.push([aw, aw1]);

        expect(hb.query(0, 10, 1, 0)).toEqual([4, 1, 5, 2, 6, 3]);
        expect(hb.query(0, 10, 1, 1)).toEqual([1, 1, 2, 2, 3, 3]);
    });

    it('returns empty data series when querying outside of the bounds', function () {
        var hb = new HistoryBufferWaveform(10);

        hb.appendArray([aw, aw1]);

        expect(hb.query(12, 13, 1)).toEqual([]);
        expect(hb.query(-1, 0, 1)).toEqual([]);
    });

    it('returns partial data when querying an interval that fits inside an analogWaveform', function () {
        var hb = new HistoryBufferWaveform(10);
        var largeAW = new NIAnalogWaveform({
            t0: 1,
            dt: 0.5,
            Y:[0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
        });

        hb.push(largeAW);

        expect(hb.query(5, 5.5, 1)).toEqual([4.5, 8, 5, 9, 5.5, 10, 6, 11]);
    });


    it('returns proper data series after the buffer overflows', function () {
        var hb = new HistoryBufferWaveform(1);

        hb.appendArray([aw, aw1]);

        expect(hb.query(0, 10, 1)).toEqual([1, 1, 2, 2, 3, 3]);
    });
});
