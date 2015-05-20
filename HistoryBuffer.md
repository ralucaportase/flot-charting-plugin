# jquery.flot.historybuffer

A historyBuffer is a data structure that enables efficient charting operations on a sliding window of data points.


Theory of operation
-------------------

In the case of large data buffers it is inneficient to draw every point of the chart. Doing this results in many almost vertical lines drawn over the same stripe of 
pixels over and over again. Drawing a line on a canvas is an expensive operation that must be avoided if possible.

One method of avoiding the repeated drawing is to reduce the amount of data points we draw on the chart by subsampling the data, also called decimation.

There are many ways to select the samples in the data; one of the best ones is to divide the interval we want to plot into "1 pixel wide buckets" and then for 
each bucket select the maximum and minimum as subsamples. This method results in a drawing that looks very similar with the one in which all samples are drawn.


The history buffer is a circular buffer holding the chart data accompanied by an acceleration structure - a tree of min/max values; an acceleration tree.
The purpose of the 

The acceleration tree makes sense and is enabled only for big data buffers.


Operations accelerated by a historyBuffer
-----------------------------------------
The common charting operations performed on a history buffer are

* inserting elements at the head
* inserting m elements at the head
* deleting elements at the tail
* deleting m elements at the tail
* compute min/max on a range
* query for a "visually interesting" data subsample on a range

