# flot-charting

Flot plugin that makes charting easy and efficient.

A chart takes a stream of data and draws a certain number of samples as a graph. 
It does maintain a HistoryBuffer with a predetermined size and width.

The HistoryBuffer uses internally a circular buffer - taken from https://github.com/trevnorris/cbuffer

How to use
----------

Once included in the webpage the plugin is activated by specifing a history buffer to use as a data series

```javascript
    var buffer = new HistoryBuffer(256, 1); // 256 sample, and a single data serie.

    plot = $.plot("#placeholder", [], {
        series: {
            historyBuffer: buffer,
            lines: {
                show: true
            }
    };
```
    
