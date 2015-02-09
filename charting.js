/*global jQuery, $, HistoryBuffer*/
/*jshint browser: true*/

$(function () {
    'use strict';
    var plot;
    var offset = 0.0;
    var buffer = new HistoryBuffer(256, 2);
    var globalIndex = 0;
    var chartLength = 14,
        chartStep = 0.1;

    function createData() {}

    function updateData() {
        var sin, cos;

        sin = Math.sin((globalIndex + 140) * chartStep);
        if (globalIndex % 50 < 30) {
            cos = Math.cos((globalIndex + 140) * chartStep);
        } else {
            cos = NaN;
        }

        globalIndex++;

        buffer.push([sin, cos]);
    }

    function updateChart() {
        requestAnimationFrame(updateChart);
        updateData();

        plot.setData([[], []]);

        plot.setupGrid();
        plot.draw();
    }

    updateData();
    plot = $.plot("#placeholder", [[], []], {
        series: {
            historyBuffer: buffer,
            lines: {
                show: true
            }
        },
        disabledcursors: [
            {
                name: 'Blue cursor',
                mode: 'xy',
                color: 'blue',
                showIntersections: true,
                snapToPlot: 1,
                symbol: 'diamond',
                position: {
                    relativeX: 400,
                    relativeY: 20
                }
            }
        ],
        grid: {
            hoverable: true,
            clickable: true,
            autoHighlight: false
        },
        yaxis: {
            min: -1.2,
            max: 1.2
        },
        legend: {
            show: false
        }
    });

    createData();
    updateChart();
});