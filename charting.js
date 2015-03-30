/*global jQuery, $, HistoryBuffer*/
/*jshint browser: true*/

$(function () {
    'use strict';
    var plot;
    var buffer = new HistoryBuffer(256, 2);
    var globalIndex = 0;
    var chartStep = 0.1;

    function updateData() {
        var sin, cos;

        sin = Math.sin(globalIndex * chartStep);
        cos = Math.cos(globalIndex * chartStep);
        globalIndex++;

        buffer.push([sin, cos]);
    }

    function updateChart() {
        setTimeout(updateChart, 32);
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
        },
        cursors: [
            {
                name: 'Orange',
                mode: 'xy',
                color: '#e0a216',
                position: {
                    relativeX: 100,
                    relativeY: 100,
                },
                showLabel: true,
                snapToPlot: 0,
                symbol: 'cross'
            },
            {
                name: 'Blue',
                mode: 'xy',
                color: '#5593c1',
                position: {
                    relativeX: 300,
                    relativeY: 200,
                },
                showLabel: true,
                snapToPlot: 1,
                symbol: 'triangle'
            }
        ]
    });

    updateChart();
});