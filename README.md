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

A chart redraw is automatically scheduled for the next Animation Frame on push or on appendArray so you don't have to.

History Buffer
--------------

A history buffer is a data structure designed to accelerate common operations needed by charting.

See [HistoryBuffer.md] (HistoryBuffer.md)

Performance considerations
--------------------------

Insertion of an element into a history buffer is a constant time operation _O(1)_.
Appending an array of length n to a history buffer is a linear time operation _O(n)_.

The complexity of drawing a chart of width P pixels with a history buffer of length N, of which M are newly added elements is _O(p)*O(log(N))*O(M logM)_  explain this in a standalone doc!!

Tests
------

[Run the tests in your browser] (https://rawgit.com/cipix2000/flot-charting/master/SpecRunner.html)
