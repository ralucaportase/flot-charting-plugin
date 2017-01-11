/*global $, HistoryBuffer*/
/*jshint browser: true*/

$(function () {
    'use strict';
    var plot;
    var buffer = new HistoryBuffer(100 * 1024, 4);
    var globalIndex = 0;
    var chartStep = 0.0001;

    function updateData() {
        var sin, cos, sin1, tan;

        for (var i = 0; i < 2048; i++) {
            sin = Math.sin(globalIndex * chartStep);
            sin1 = 1 - sin;
            cos = Math.cos(globalIndex * chartStep);
            tan = Math.tan(globalIndex * chartStep) / 10.0;
            tan = Math.min(tan, 3);
            tan = Math.max(tan, -3);
            globalIndex++;

            buffer.push([sin, cos, sin1, tan]);
        }
    }

    plot = $.plot('#placeholder', [[], [], [], []], {
        series: {
            historyBuffer: buffer,
            lines: {
                show: true,
                //lineWidth: 1
            },
            shadowSize: 0
        },
        legend: {
            show: false
        }
    });

    setInterval(updateData, 16);
});