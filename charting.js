/*global jQuery, $, HistoryBuffer*/
/*jshint browser: true*/

$(function () {
    'use strict';
    var plot;
    var buffer = new HistoryBuffer(1024 * 1024, 1);
    var globalIndex = 0;
    var chartStep = 0.00001;

    function updateData() {
        var sin, cos;

        for (var i = 0; i < 2048; i++) {
            sin = Math.sin(globalIndex * chartStep);
            //cos = Math.cos(globalIndex * chartStep);
            globalIndex++;

            buffer.push(sin);
        }
    }

    function updateChart() {
        setTimeout(updateChart, 16);
        updateData();
    }

    plot = $.plot("#placeholder", [], {
        series: {
            historyBuffer: buffer,
            lines: {
                show: true
            }
        },
        legend: {
            show: false
        }
    });

    setInterval(updateData, 16)
});