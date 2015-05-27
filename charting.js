/*global $, HistoryBuffer*/
/*jshint browser: true*/

$(function () {
    'use strict';
    var plot;
    var buffer = new HistoryBuffer(10 * 1024, 2);
    var globalIndex = 0;
    var chartStep = 0.00001;

    function updateData() {
        var sin, cos;

        for (var i = 0; i < 2048; i++) {
            sin = Math.sin(globalIndex * chartStep);
            cos = Math.cos(globalIndex * chartStep);
            globalIndex++;

            buffer.push([sin, cos]);
        }
    }

    plot = $.plot('#placeholder', [], {
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

    setInterval(updateData, 16);
});