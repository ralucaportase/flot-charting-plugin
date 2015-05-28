/*global $, HistoryBuffer*/
/*jshint browser: true*/

$(function () {
    'use strict';
    var plot;
    var buffer = new HistoryBuffer(200 * 1024, 3);
    var globalIndex = 0;
    var chartStep = 0.0001;

    function updateData() {
        var sin, cos, sin1;

        for (var i = 0; i < 2048; i++) {
            sin = Math.sin(globalIndex * chartStep);
            sin1 = 1 - sin;
            cos = Math.cos(globalIndex * chartStep);
            //tan = Math.tan(globalIndex * chartStep);
            globalIndex++;

            buffer.push([sin, cos, sin1]);
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