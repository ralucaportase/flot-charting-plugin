/* Flot plugin that makes use of history buffers possible.

Copyright (c) 2007-2015 Natinal Instruments
Licensed under the MIT license.
*/
/*global jQuery*/


(function ($) {
    function processRawData(plot, series, datapoints) {
        if (series.historyBuffer) {
            series.data = series.historyBuffer.toSeries(plot.getData().indexOf(series));
        }
    }

    function init(plot) {
        plot.hooks.processRawData.push(processRawData);
    }

    $.plot.plugins.push({
        init: init,
        name: 'charting',
        version: '0.1'
    });
})(jQuery);