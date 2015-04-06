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
        var tree = {
            depth: 1,
            levels: []
        };

        this.tree = tree;
    };

    HistoryBuffer.prototype.populateAccelerationTree = function () {
        var buffer = this.buffer;
        var node;
        var currentCount = 1;

        this.tree.levels.push(new TreeLevel(this, 1));

        if (buffer.size === 0) {
            return;
        }

        var max = buffer.get(0),
            min = buffer.get(0);

        for (var i = 1; i < buffer.size; i++) {
            var val = buffer.get(i);
            if (val > max) {
                max = val;
            }

            if (val < min) {
                min = val;
            }

            currentCount++;

            if (currentCount === branchFactor) {
                currentCount = 0;
                node = new TreeNode();

                node.max = max;
                node.min = min;
                this.tree.levels.push(node);
            }
        }

        if (currentCount !== 0) {
            node = new TreeNode();

            node.max = max;
            node.min = min;
            this.tree.levels[0].nodes.push(node);
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

    if (typeof module === 'object' && module.exports) module.exports = HistoryBuffer;
    else global.HistoryBuffer = HistoryBuffer;
}(this));