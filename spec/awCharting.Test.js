/* global $, describe, it, beforeEach, afterEach, expect, HistoryBuffer, setFixtures */
/* jshint browser: true*/
/* brackets-xunit: includes=../lib/cbuffer.js,../jquery.flot.historybuffer.js*,../jquery.flot.js,../jquery.flot.charting.js */

describe('A chart', function () {
    'use strict';

    var plot;
    var placeholder;

    beforeEach(function () {
        var fixture = setFixtures('<div id="demo-container" style="width: 800px;height: 600px">').find('#demo-container').get(0);
        placeholder = $('<div id="placeholder" style="width: 100%;height: 100%">');
        placeholder.appendTo(fixture);
    });

    afterEach(function () {
        if (plot) {
            plot.shutdown();
        }
    });

    it('allows to specify a HistoryBufferWaveform when creating the plot', function () {
        var hb = new HistoryBufferWaveform(10, 1);
        var aw = new NIAnalogWaveform({
            t0: 4,
            dt: 1,
            Y:[1, 2, 3]
        });

        hb.push(aw);
        plot = $.plot(placeholder, [{}], {
            series: {
                historyBuffer: hb
            }
        });

        expect(plot.getData()[0].datapoints.points).toEqual([4, 1, 5, 2, 6, 3]);
    });

    it('works with multiple analogWaveforms in the HistoryBufferWaveform', function () {
        var hb = new HistoryBufferWaveform(10, 1);
        var aw = new NIAnalogWaveform({
            t0: 4,
            dt: 1,
            Y:[1, 2, 3]
        });

        var aw1 = new NIAnalogWaveform({
            t0: 1,
            dt: 1,
            Y:[1, 2, 3]
        });

        hb.push(aw);
        hb.push(aw1);

        plot = $.plot(placeholder, [{}], {
            series: {
                historyBuffer: hb
            }
        });

        expect(plot.getData()[0].datapoints.points).toEqual([4, 1, 5, 2, 6, 3, null, null, 1, 1, 2, 2, 3, 3]);
    });
});
