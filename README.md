# flot-charting

Flot plugin that makes charting easy and efficient.

A chart takes one or more streams of data, keeps a number of samples in a buffer called HistoryBuffer and
draws them as a graph.

How to use
----------

Once included in the webpage the plugin is activated by specifing a history buffer to use as a data series

```javascript
    var buffer = new HistoryBuffer(256, 1); // 256 samples, and a single data serie.

    plot = $.plot("#placeholder", [], {
        series: {
            historyBuffer: buffer,
            lines: {
                show: true
            }
    };
```
    
