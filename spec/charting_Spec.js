/* global $, describe, it, beforeEach, afterEach, expect, jasmine, HistoryBuffer, setFixtures */
/* jshint browser: true*/
/* brackets-xunit: includes=../lib/cbuffer.js,../jquery.flot.historybuffer.js*,../jquery.flot.js,../jquery.flot.charting.js */

describe('Flot charting: ', function () {
    'use strict';

    var plot;
    var placeholder;

    beforeEach(function () {
        jasmine.clock().install();

        var fixture = setFixtures('<div class="demo-container">').find('.demo-container').get(0);
        placeholder = $('<div id="placeholder" class="demo-placeholder">');

        placeholder.appendTo(fixture);
    });

    afterEach(function () {
        if (plot) {
            plot.shutdown();
        }
        jasmine.clock().uninstall();
    });

    it('should be possible to specify a historyBuffer when creating the plot', function () {
        var hb = new HistoryBuffer(10, 1);
        hb.push(33);
        plot = $.plot(placeholder, [[]], {
            series: {
                historyBuffer: hb
            }
        });

        jasmine.clock().tick(1);
        expect(plot.getData()[0].data).toEqual([[0, 33]]);
    });

    it('should keep track of the total number of elements introduced in the buffer', function () {
        var hb = new HistoryBuffer(1, 1);
        hb.push(33);
        hb.push(34);
        plot = $.plot(placeholder, [[]], {
            series: {
                historyBuffer: hb
            }
        });

        expect(plot.getData()[0].data).toEqual([[1, 34]]);
    });
});
