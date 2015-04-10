/* history buffers datastructure for charting.

Copyright (c) 2007-2015 National Instruments
Licensed under the MIT license.
*/
/*globals $, CBuffer, module*/

$(function (global) {
    'use strict';

    var branchFactor = 32;

    var TreeNode = function () {
        this.start = 0;
        this.end = 0;
        this.parent = 0;
        this.max = Math.Nan;
        this.min = Math.Nan;
    };

    var TreeLevel = function (historyBuffer, level) {
        this.level = level;
        this.capacity = Math.ceil(historyBuffer.capacity / (Math.pow(branchFactor, level))) + 1;
        this.nodes = [];
    };

    /* Chart History buffer */
    var HistoryBuffer = function (capacity, width) {
        this.capacity = capacity || 1024;
        this.width = width || 1;
        this.buffer = new CBuffer(capacity); /* circular buffer */
        this.count = 0;

        this.buildEmptyAccelerationTree();
    };

    HistoryBuffer.prototype.buildEmptyAccelerationTree = function () {
        var depth = Math.ceil(Math.log(this.capacity) / Math.log(branchFactor)) - 1;
        if (depth < 1)
            depth = 1;
        var tree = {
            depth: depth,
            levels: []
        };

        this.tree = tree;
        for (var i = 0; i < depth; i++) {
            this.tree.levels.push(new TreeLevel(this, i + 1));
        }
    };

    HistoryBuffer.prototype.populateAccelerationTree = function () {
        var buffer = this.buffer;
        var node;
        var currentCount = 0;

        if (buffer.size === 0) {
            return;
        }

        var max, min;

        // populate the first level
        for (var i = 0; i < buffer.size; i++) {
            var val = buffer.get(i);

            if (currentCount === 0) {
                max = val;
                min = val;
            } else {
                if (val > max) max = val;
                if (val < min) min = val;
            }

            currentCount++;

            if (currentCount === branchFactor) {
                currentCount = 0;
                node = new TreeNode();

                node.max = max;
                node.min = min;
                this.tree.levels[0].nodes.push(node);
            }
        }

        if (currentCount !== 0) {
            node = new TreeNode();

            node.max = max;
            node.min = min;
            this.tree.levels[0].nodes.push(node);
        }

        // populate higher levels
        for (var j = 1; j < this.tree.depth; j++) {
            var baseLevel = this.tree.levels[j - 1];
            var currentLevel = this.tree.levels[j];

            currentCount = 0;

            for (i = 0; i < baseLevel.nodes.length; i++) {
                var cNode = baseLevel.nodes[i];
                if (currentCount === 0) {
                    max = cNode.max;
                    min = cNode.min;
                } else {
                    if (cNode.max > max) max = cNode.max;
                    if (cNode.min < min) min = cNode.min;
                }

                currentCount++;

                if (currentCount === branchFactor) {
                    currentCount = 0;
                    node = new TreeNode();

                    node.max = max;
                    node.min = min;
                    this.tree.levels[j].nodes.push(node);
                }
            }

            if (currentCount !== 0) {
                node = new TreeNode();

                node.max = max;
                node.min = min;
                this.tree.levels[j].nodes.push(node);
            }
        }
    };

    HistoryBuffer.prototype.setCapacity = function (newCapacity) {
        if (newCapacity !== this.capacity) {
            this.buffer = new CBuffer(newCapacity);
            this.capacity = newCapacity;
        }
    };

    HistoryBuffer.prototype.pop = function () {
        return this.buffer.pop();
    };

    HistoryBuffer.prototype.push = function (item) {
        this.buffer.push(item);
        this.count++;
        if (this.callOnChange) {
            this.callOnChange();
        }
    };

    HistoryBuffer.prototype.appendArray = function (arr) {
        for (var i = 0; i < arr.length; i++) {
            this.buffer.push(arr[i]);
        }

        this.count += arr.length;

        if (this.callOnChange) {
            this.callOnChange();
        }
    };

    HistoryBuffer.prototype.toArray = function () {
        // TO DO make the implementation fast
        var buffer = this.buffer;

        return buffer.toArray();
    };

    HistoryBuffer.prototype.toSeries = function (index) {
        // TO DO make the implementation fast
        var buffer = this.buffer;
        var j;

        var data = [];

        var start = Math.max(0, this.count - this.capacity);

        for (var i = 0; i < buffer.size; i++) {
            if (this.width > 1) {
                data.push([i + start, buffer.get(i)[index]]);
            } else {
                data.push([i + start, buffer.get(i)]);
            }
        }

        return data;
    };

    HistoryBuffer.prototype.onChange = function (f) {
        this.callOnChange = f;
    };

    HistoryBuffer.prototype.firstIndex = function () {
        return Math.max(0, this.count - this.capacity);
    };

    HistoryBuffer.prototype.lastIndex = function () {
        return this.firstIndex() + this.buffer.size;
    };

    HistoryBuffer.prototype.findMax = function (start, end) {
        return start;
    };

    HistoryBuffer.prototype.findMin = function (start, end) {
        return start;
    };

    // get a subsample of the series, starting at the start sample, ending at the end sample with a provided step
    HistoryBuffer.prototype.query = function (start, end, step) {
        var buffer = this.buffer;
        var i, j;

        var data = [];

        var firstIndex = this.firstIndex();
        var lastIndex = this.lastIndex();

        if (start < firstIndex) {
            start = firstIndex;
        }
        if (start > lastIndex) {
            start = lastIndex;
        }

        if (end < firstIndex) {
            end = firstIndex;
        }
        if (end > lastIndex) {
            end = lastIndex;
        }

        if (step < 4) {
            for (i = start - firstIndex; i < end - firstIndex; i++) {
                data.push([i + firstIndex, buffer.get(i)]);
            }
        } else {
            var max, maxIndex, min, minIndex;
            for (i = start - firstIndex; i < end - firstIndex; i += step) {
                maxIndex = this.findMax(i, i + step);
                minIndex = this.findMin(i, i + step);
                if (minIndex === maxIndex) {
                    data.push([minIndex, buffer.get(minIndex)]);
                } else if (minIndex < maxIndex) {
                    data.push([minIndex, buffer.get(minIndex)]);
                    data.push([maxIndex, buffer.get(maxIndex)]);
                } else {
                    data.push([maxIndex, buffer.get(maxIndex)]);
                    data.push([minIndex, buffer.get(minIndex)]);
                }
            }
        }

        return data;
    };

    if (typeof module === 'object' && module.exports) module.exports = HistoryBuffer;
    else global.HistoryBuffer = HistoryBuffer;
}(this));