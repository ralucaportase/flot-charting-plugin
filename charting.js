/*global jQuery, $*/
/*jshint browser: true*/

$(function () {
    'use strict';
    var plot;
    var offset = 0.0;
    var sin = [],
        cos = [];
    var globalIndex = 0;
    var chartLength = 14,
        chartStep = 0.1;

    function createData() {
        sin = [];
        cos = [];
        for (var i = 0; i < chartLength; i += chartStep) {
            sin.push([i, Math.sin(i)]);
            cos.push([i, Math.cos(i)]);
        }
    }

    function updateData() {
        sin = sin.slice(1);
        cos = cos.slice(1);

        sin.push([(globalIndex + 140) * chartStep, Math.sin((globalIndex + 140) * chartStep)]);
        cos.push([(globalIndex + 140) * chartStep, Math.cos((globalIndex + 140) * chartStep)]);

        globalIndex++;
    }

    function updateChart() {
        requestAnimationFrame(updateChart);
        updateData();

        plot.setData([
            {
                data: sin,
                label: "sin(x)"
                },
            {
                data: cos,
                label: "cos(x)"
                }
            ]);

        plot.setupGrid();
        plot.draw();
    }

    updateData();
    plot = $.plot("#placeholder", [
        {
            data: sin,
            label: "sin(x)"
        },
        {
            data: cos,
            label: "cos(x)"
        }
    ], {
        series: {
            lines: {
                show: true
            }
        },
        cursors: [
            {
                name: 'Red cursor',
                mode: 'x',
                color: 'red',
                showIntersections: false,
                showLabel: true,
                symbol: 'triangle',
                position: {
                    relativeX: 200,
                    relativeY: 300
                }
            },
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
            },
            {
                name: 'Green cursor',
                mode: 'y',
                color: 'green',
                showIntersections: true,
                symbol: 'cross',
                showValuesRelativeToSeries: 0,
                showLabel: true,
                position: {
                    relativeX: 100,
                    relativeY: 200
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
        }
    });

    createData();
    updateChart();
});