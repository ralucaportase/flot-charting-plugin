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
        this.maxIndex = 0;
        this.minIndex = 0;
        this.max = Math.Nan;
        this.min = Math.Nan;
    };

    var TreeLevel = function (historyBuffer, level) {
        this.level = level;
        this.step = Math.pow(branchFactor, level);
        this.capacity = Math.ceil(historyBuffer.capacity / (Math.pow(branchFactor, level))) + 1;
        this.startIndex = 0;
        this.nodes = new CBuffer(this.capacity);
    };

    TreeLevel.prototype.shift = function () {
        this.startIndex += this.step;
        this.nodes.push(new TreeNode());
    };

    /* Chart History buffer */
    var HistoryBuffer = function (capacity, width) {
        this.capacity = capacity || 1024;
        this.width = width || 1;
        this.buffer = new CBuffer(capacity); /* circular buffer */
        this.count = 0;
        this.changed = false;
        this.lastUpdatedIndex = 0;
        this.firstUpdatedIndex = 0;

        this.buildEmptyAccelerationTree();
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

        this.changed = true;
        if (this.callOnChange) {
            this.callOnChange();
        }
    };

    HistoryBuffer.prototype.startIndex = function () {
        return Math.max(0, this.count - this.capacity);
    };

    HistoryBuffer.prototype.get = function (index) {
        index -= this.startIndex();
        return this.buffer.get(index);
    };

    HistoryBuffer.prototype.appendArray = function (arr) {
        for (var i = 0; i < arr.length; i++) {
            this.buffer.push(arr[i]);
        }

        this.count += arr.length;

        this.changed = true;
        if (this.callOnChange) {
            this.callOnChange();
        }
    };

    HistoryBuffer.prototype.getTreeNode = function (level, index) {
        var treeLevel = this.tree.levels[level];
        var levelStep = treeLevel.step;
        var levelIndex = Math.floor((index - treeLevel.startIndex) / levelStep);

        if ((levelIndex < 0) || (levelIndex >= treeLevel.capacity)) {
            return null;
        }

        var node = treeLevel.nodes.get(levelIndex);

        return node;
    };

    HistoryBuffer.prototype.toArray = function () {
        return this.buffer.toArray();
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
            var tLevel = new TreeLevel(this, i + 1);
            this.tree.levels.push(tLevel);
            for (var j = 0; j < tLevel.capacity; j++) {
                var node = new TreeNode();
                tLevel.nodes.push(node);
            }
        }
    };

    /*
     * Partially populate first level of the tree. Only take into consideration values starting at the startingFromIndex.
     * All the tree levels should be shifted as necessary (consistent)
     */
    HistoryBuffer.prototype.populateFirstTreeLevel = function (startingFrom) {
        var currentCount = 0;
        var i = 0;
        var firstSample = true;
        var node, max, maxIndex, min, minIndex;

        /* align starting from to a branchFactor boundary*/
        startingFrom = Math.floor(startingFrom / branchFactor) * branchFactor;

        if (this.startIndex() > startingFrom) {
            startingFrom = this.startIndex();
            currentCount = startingFrom % branchFactor;
        }

        for (i = startingFrom; i < this.lastIndex(); i++) {
            var val = this.get(i);

            if (firstSample) {
                max = val;
                maxIndex = i;
                min = val;
                minIndex = i;

                firstSample = false;
            } else {
                if (val > max) {
                    max = val;
                    maxIndex = i;
                }
                if (val < min) {
                    min = val;
                    minIndex = i;
                }
            }

            currentCount++;

            if (currentCount === branchFactor) {
                currentCount = 0;
                firstSample = true;
                node = this.getTreeNode(0, i);

                node.max = max;
                node.maxIndex = maxIndex;
                node.min = min;
                node.minIndex = minIndex;
            }
        }

        if (currentCount !== 0) {
            node = this.getTreeNode(0, i);

            node.max = max;
            node.maxIndex = maxIndex;
            node.min = min;
            node.minIndex = minIndex;
        }
    };

    /*
     * Partially populate the rest of the levels of the tree. Only take into consideration values starting at the startingFromIndex.
     * All the tree levels should be shifted as necessary (consistent)
     */
    HistoryBuffer.prototype.populateTreeLevel = function (startingFrom, level) {
        var currentCount = 0;
        var i = 0;
        var firstSample = true;
        var node, max, maxIndex, min, minIndex;

        var baseLevel = this.tree.levels[level - 1];
        var currentLevel = this.tree.levels[level];

        /* align starting from to a node in the base level boundary*/
        startingFrom = Math.floor(0 / currentLevel.step) * currentLevel.step;

        if (baseLevel.startIndex > startingFrom) {
            startingFrom = baseLevel.startIndex;
            currentCount = (startingFrom / baseLevel.step) % branchFactor;
        }

        for (i = startingFrom; i < this.lastIndex(); i += baseLevel.step) {
            var cNode = this.getTreeNode(level - 1, i);
            if (firstSample) {
                max = cNode.max;
                maxIndex = cNode.maxIndex;
                min = cNode.min;
                minIndex = cNode.minIndex;
                firstSample = false;
            } else {
                if (cNode.max > max) {
                    max = cNode.max;
                    maxIndex = cNode.maxIndex;
                }
                if (cNode.min < min) {
                    min = cNode.min;
                    minIndex = cNode.minIndex;
                }
            }

            currentCount++;

            if (currentCount === branchFactor) {
                currentCount = 0;
                firstSample = true;
                node = this.getTreeNode(level, i);

                node.max = max;
                node.maxIndex = maxIndex;
                node.min = min;
                node.minIndex = minIndex;
            }
        }

        if (currentCount !== 0) {
            node = this.getTreeNode(level, i);

            node.max = max;
            node.maxIndex = maxIndex;
            node.min = min;
            node.minIndex = minIndex;
        }
    };


    // when shifting the history buffer to the left, update the leftmost nodes in the tree
    HistoryBuffer.prototype.shiftTreeLevel = function (level) {
        var startingIndex = this.startIndex();
        var treeLevel = this.tree.levels[level];

        var alignedStartIndex = Math.floor(startingIndex / treeLevel.step) * treeLevel.step;

        while (treeLevel.startIndex < alignedStartIndex) {
            treeLevel.shift();
        }

        /* update the first node in level */
        if (startingIndex !== alignedStartIndex) {
            var minmax = {
                minIndex: startingIndex,
                min: this.get(startingIndex),
                maxIndex: startingIndex,
                max: this.get(startingIndex)
            };
            var i;
            var firstNode = treeLevel.nodes.get(0);

            if (level === 0) {
                for (i = startingIndex; i < (alignedStartIndex + branchFactor); i++) {
                    updateMinMaxFromValue(i, this.get(i), minmax);
                }

            } else {
                for (i = startingIndex; i < (alignedStartIndex + treeLevel.step); i += treeLevel.step / branchFactor) {
                    updateMinMaxFromNode(this.getTreeNode(level - 1, i), minmax);
                }
            }

            firstNode.minIndex = minmax.minIndex;
            firstNode.min = minmax.min;
            firstNode.maxIndex = minmax.maxIndex;
            firstNode.max = minmax.max;
        }
    };

    HistoryBuffer.prototype.updateAccelerationTree = function () {
        var buffer = this.buffer;
        var level;

        for (level = 0; level < this.tree.depth; level++) {
            this.shiftTreeLevel(level);
        }

        for (level = 0; level < this.tree.depth; level++) {
            if (level === 0) {
                this.populateFirstTreeLevel(this.lastUpdatedIndex);
            } else {
                this.populateTreeLevel(this.lastUpdatedIndex, level);
            }
        }

        this.lastUpdatedIndex = this.startIndex() + buffer.size;
        this.firstUpdatedIndex = this.startIndex();
    };

    HistoryBuffer.prototype.toSeries = function (index) {
        var buffer = this.buffer;
        var j;

        var data = [];

        var start = this.startIndex();

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

    HistoryBuffer.prototype.lastIndex = function () {
        return this.startIndex() + this.buffer.size;
    };

    function updateMinMaxFromValue(index, value, minmax) {
        if (value < minmax.min) {
            minmax.min = value;
            minmax.minIndex = index;
        }
        if (value > minmax.max) {
            minmax.max = value;
            minmax.maxIndex = index;
        }
    }

    function updateMinMaxFromNode(node, minmax) {
        if (node.min < minmax.min) {
            minmax.min = node.min;
            minmax.minIndex = node.minIndex;
        }
        if (node.max > minmax.max) {
            minmax.max = node.max;
            minmax.maxIndex = node.maxIndex;
        }
    }

    HistoryBuffer.prototype.readMinMax = function (start, end) {
        var intervalSize = end - start;
        var i;
        var minmax = {
            minIndex: start,
            min: this.get(start),
            maxIndex: start,
            max: this.get(start)
        };

        var level = Math.floor(Math.log(intervalSize) / Math.log(branchFactor));

        if (level === 0) {
            for (i = start; i < end; i++) {
                updateMinMaxFromValue(i, this.get(i), minmax);
            }
            return minmax;
        }

        var step = Math.pow(branchFactor, level);
        var truncatedStart = Math.ceil(start / step) * step;
        var truncatedEnd = Math.floor(end / step) * step;

        if (start !== truncatedStart) {
            minmax = this.readMinMax(start, truncatedStart);
        }

        if (end !== truncatedEnd) {
            updateMinMaxFromNode(this.readMinMax(truncatedEnd, end), minmax);
        }

        var truncatedBufferStart = Math.floor(this.startIndex() / step) * step;
        var begin = (truncatedStart - truncatedBufferStart) / step;
        var finish = (truncatedEnd - truncatedBufferStart) / step;

        for (i = begin; i < finish; i++) {
            updateMinMaxFromNode(this.tree.levels[level - 1].nodes.get(i), minmax);
        }

        return minmax;
    };

    // get a subsample of the series, starting at the start sample, ending at the end sample with a provided step
    HistoryBuffer.prototype.query = function (start, end, step) {
        var buffer = this.buffer;
        var i, j;

        var data = [];

        if (this.changed) {
            this.updateAccelerationTree();
            this.changed = false;
        }

        var firstIndex = this.startIndex();
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
            for (i = start; i < end; i++) {
                data.push([i, this.get(i)]);
            }
        } else {
            var minmax;
            var max, maxIndex, min, minIndex;
            for (i = start; i < end; i += step) {
                var partialQueryEnd = Math.min(end, i + step);
                minmax = this.readMinMax(i, partialQueryEnd);
                maxIndex = minmax.maxIndex;
                minIndex = minmax.minIndex;
                if (minIndex === maxIndex) {
                    data.push([minIndex, minmax.min]);
                } else if (minIndex < maxIndex) {
                    data.push([minIndex, minmax.min]);
                    data.push([maxIndex, minmax.max]);
                } else {
                    data.push([maxIndex, minmax.max]);
                    data.push([minIndex, minmax.min]);
                }
            }
        }

        return data;
    };

    if (typeof module === 'object' && module.exports) module.exports = HistoryBuffer;
    else global.HistoryBuffer = HistoryBuffer;
}(this));