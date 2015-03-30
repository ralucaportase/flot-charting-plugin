/* global $, describe, it, xit, after, beforeEach, afterEach, expect, jasmine, spyOn, HistoryBuffer */
/* jshint browser: true*/

describe('Flot charting: ', function () {
    'use strict';

    var plot;

    beforeEach(function () {
        jasmine.clock().install();
    });

    afterEach(function () {
        if (plot) {
            plot.shutdown();
        }
        $('#placeholder').empty();
        jasmine.clock().uninstall();
    });

    it('should be possible to specify a historyBuffer when creating the plot', function () {
        var hb = new HistoryBuffer(10, 1);
        hb.push(33);
        plot = $.plot("#placeholder", [[]], {
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
        plot = $.plot("#placeholder", [[]], {
            series: {
                historyBuffer: hb
            }
        });

        expect(plot.getData()[0].data).toEqual([[1, 34]]);
    });
});