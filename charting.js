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

        for (var i = 0; i < 1024; i++) {
            sin = Math.sin(globalIndex * chartStep);
            //cos = Math.cos(globalIndex * chartStep);
            globalIndex++;

            buffer.push(sin);
        }
    }

    function updateChart() {
        setTimeout(updateChart, 4);
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
        /*,
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
            }
        ]*/
    });

    updateChart();
});