# jquery.flot.historybuffer

A historyBuffer is a data structure that enables efficient charting operations on a sliding window of data points.

Charting
--------


Operations accelerated by a historyBuffer
-----------------------------------------

The common charting operations performed on a history buffer are

* inserting elements at the head
* inserting m elements at the head
* deleting elements at the tail
* deleting m elements at the tail
* compute min/max on a range
* query for a "visually interesting" data subsample on a range


Theory of operation
-------------------
