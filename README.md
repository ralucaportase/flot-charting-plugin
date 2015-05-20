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

A chart redraw is automatically scheduled (on a newly requested Animation Frame) on push or on appendArray so you don't have to.

Theory of operation
-------------------


In the case of large buffers it is inneficient to draw every point of the chart. Doing this results in many almost vertical lines drawn over the same stripe of 
pixels over and over again. Drawing a line on a canvas is an expensive operation that must be avoided if possible.

One method of avoiding the repeated drawing is to reduce the amount of data points we draw on the chart by subsampling the data, also called decimation.

There are many ways to select the samples in the data; one of the best ones is to divide the interval we want to plot into "1 pixel wide buckets" and then for 
each bucket select the maximum and minimum as subsamples. This method results in a drawing that looks very similar with the one in which all samples are drawn.


The history buffer is a circular buffer holding the chart data accompanied by an acceleration structure - a tree of min/max values; an acceleration tree.
The purpose of the 

The acceleration tree is only enabled for big history buffers.





Performance considerations
--------------------------

Insertion of an element into a history buffer is a constant time operation _O(1)_.
Appending an array of length n to a history buffer is a linear time operation _O(n)_.

The complexity of drawing a chart of width P pixels with a history buffer of length N, of which M are newly added elements is _O(p)*O(log(N))*O(M logM)_  explain this in a standalone doc!!

Tests
------