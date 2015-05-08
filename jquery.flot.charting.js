/* Flot plugin that makes charting easier and more efficient.

Copyright (c) 2007-2015 National Instruments
Licensed under the MIT license.
*/
/*global jQuery, requestAnimationFrame*/


(function ($) {
    'use strict';

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

            series.data = series.historyBuffer.query(hb.startIndex(), hb.lastIndex(), step);
        }
    }

    function cleanupData(plot, hb) {
        var series = [];
        for (var i = 0; i < hb.width; i++) {
            series.push([]);
        }
        plot.setData(series);
    }

    function triggerDataUpdate(plot, hb) {
        if (!plot.dataUpdateTriggered) {
            plot.dataUpdateTriggered = requestAnimationFrame(function () {
                performDataUpdate(plot, hb);
                plot.dataUpdateTriggered = null;
            });
        }
    }

    function performDataUpdate(plot, hb) {
        cleanupData(plot, hb);
        plot.setupGrid();
        plot.draw();
    }

    function init(plot) {
        plot.hooks.processOptions.push(function (plot) {
            var hb = plot.getOptions().series.historyBuffer;

            if (hb) {
                plot.hooks.processRawData.push(processRawData);
                hb.onChange(function () {
                    triggerDataUpdate(plot, hb);
                });
                cleanupData(plot, hb);
            }
        });
    }

    $.plot.plugins.push({
        init: init,
        name: 'charting',
        version: '0.2'
    });
})(jQuery);