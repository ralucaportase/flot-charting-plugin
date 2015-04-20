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

Then you add data to the history buffer 

```javascript
    buffer.push(7); // append a number to the buffer
    buffer.appendArray([1, 2, 3, 4]); // or append an array to the buffer
```

A chart redraw is automatically scheduled (requestAnimationFrame) on push or on appendArray so you don't have to.
