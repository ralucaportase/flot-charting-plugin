/* Flot plugin that makes charting easier and more efficient.

Copyright (c) 2007-2015 National Instruments
Licensed under the MIT license.
*/
/*global jQuery, requestAnimationFrame*/


(function ($) {
    'use strict';

    // flot hook which decimates the data from the historyBuffer and converts it into a format that flot understands
    function processRawData(plot, series) {
        if (series.historyBuffer) {
            var hb = series.historyBuffer;
            var size = hb.buffer.size;
            var width = plot.width();
            var step;

            if (width > 0) {
                step = Math.floor(size / plot.width());
            } else {
                step = Math.floor(size / 500);
            }

            var index = plot.getData().indexOf(series);
            series.data = series.historyBuffer.query(hb.startIndex(), hb.lastIndex(), step, index);
        }
    }

    // remove old series data and compute a new one from the history buffer
    function updateSeries(plot, hb) {
        var series = [];
        for (var i = 0; i < hb.width; i++) {
            series.push([]);
        }

        plot.setData(series);
    }

    // draw the chart
    function drawChart(plot) {
        plot.setupGrid();
        plot.draw();
    }

    // called on every history buffer change. 
    function triggerDataUpdate(plot, hb) {
        if (!plot.dataUpdateTriggered) {
            plot.dataUpdateTriggered = requestAnimationFrame(function () { // throttle charting computation/drawing to the browser frame rate
                updateSeries(plot, hb);
                drawChart(plot);
                plot.dataUpdateTriggered = null;
            });
        }
    }

    // plugin entry point
    function init(plot) {
        plot.hooks.processOptions.push(function (plot) {
            var hb = plot.getOptions().series.historyBuffer; // looks for the historyBuffer option
            if (hb) {
                plot.hooks.processRawData.push(processRawData); // enable charting plugin for this flot chart
                hb.onChange(function () {
                    triggerDataUpdate(plot, hb); // call triggerDataUpdate on every historyBuffer modification
                });
                updateSeries(plot, hb);
            }
        });
    }

    $.plot.plugins.push({
        init: init,
        name: 'charting',
        version: '0.3'
    });
})(jQuery);
