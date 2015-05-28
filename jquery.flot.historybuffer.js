/* history buffer data structure for charting.

Copyright (c) 2007-2015 National Instruments
Licensed under the MIT license.
*/
/*globals CBuffer, module*/

(function (global) {
    'use strict';

    /* The branching factor determines how many samples are decimated in a tree node.
     * It affects the performance and the overhead of the tree.
     */
    var branchFactor = 32; // 32 for now. TODO tune the branching factor.
    //var accelerationTreeActivationSize = 1024; // the size at which the acceleration tree starts to provide improvements. TO DO.

    /* a TreeNode object keeps information about min and max values in the subtree below it*/
    var TreeNode = function () {
        this.init();
    };

    var Tree = function (hb, cbuffer) {
        this.historyBuffer = hb;
        this.cbuffer = cbuffer;
        this.tree = this.buildEmptyAccelerationTree();
    };

    TreeNode.prototype.init = function () {
        this.maxIndex = 0;
        this.minIndex = 0;
        this.max = Math.Nan;
        this.min = Math.Nan;
    };

    /* a tree level is a heap of tree nodes at a certain depth in the tree*/
    var TreeLevel = function (historyBuffer, level) {
        this.level = level;
        this.step = Math.pow(branchFactor, level);
        this.capacity = Math.ceil(historyBuffer.capacity / (Math.pow(branchFactor, level))) + 1;
        this.startIndex = 0;
        this.nodes = new CBuffer(this.capacity);
    };

    /* rotate the nodes in the TreeLevel to the left.*/
    TreeLevel.prototype.rotate = function () {
        this.startIndex += this.step;

        var oldestNode = this.nodes.shift(); //reuse the tree nodes to reduce GC
        oldestNode.init();
        this.nodes.push(oldestNode);
    };

    /* Chart History buffer */
    var HistoryBuffer = function (capacity, width) {
        this.capacity = capacity || 1024;
        this.width = width || 1;
        this.lastUpdatedIndex = 0;
        this.firstUpdatedIndex = 0;

        this.buffers = []; // circular buffers for data
        this.trees = []; // acceleration trees

        for (var i = 0; i < this.width; i++) {
            this.buffers.push(new CBuffer(capacity));
            this.trees.push(new Tree(this, this.buffers[i]));
        }

        this.buffer = this.buffers[0];
        this.tree = this.trees[0];

        this.count = 0;
        this.callOnChange = undefined;
        this.changed = false;
    };

    HistoryBuffer.prototype.setBranchingFactor = function (b) {
        branchFactor = b;
    };

    /* change the capacity of the History Buffer and clean all the data inside it */
    HistoryBuffer.prototype.setCapacity = function (newCapacity) {
        if (newCapacity !== this.capacity) {
            this.capacity = newCapacity;
            this.buffers = []; // circular buffers for data
            this.trees = []; // acceleration trees

            for (var i = 0; i < this.width; i++) {
                this.buffers.push(new CBuffer(newCapacity));
                this.trees.push(new Tree(this, this.buffers[i]));
            }

            this.buffer = this.buffers[0];
            this.tree = this.trees[0];

            this.count = 0; // todo fire changes and upate lastindex, startindex
        }
    };

    /* store an element in the history buffer, don't update stats */
    HistoryBuffer.prototype.pushNoStatsUpdate = function (item) {
        if (this.width === 1) {
            this.buffer.push(item);
        } else {
            if (Array.isArray(item) && item.length === this.width) {
                for (var i = 0; i < this.width; i++) {
                    this.buffers[i].push(item[i]);
                }
            }
        }
    };

    /* store an element in the history buffer */
    HistoryBuffer.prototype.push = function (item) {
        this.pushNoStatsUpdate(item);
        this.count++;

        this.changed = true;
        if (this.callOnChange) {
            this.callOnChange();
        }
    };

    /* the index of the oldest element in the buffer*/
    HistoryBuffer.prototype.startIndex = function () {
        return Math.max(0, this.count - this.capacity);
    };

    /* the index of the newest element in the buffer*/
    HistoryBuffer.prototype.lastIndex = function () {
        return this.startIndex() + this.buffer.size;
    };

    /*get the nth element in the buffer*/
    HistoryBuffer.prototype.get = function (index) {
        index -= this.startIndex();
        if (this.width === 1) {
            return this.buffer.get(index);
        } else {
            var res = [];

            for (var i = 0; i < this.width; i++) {
                res.push(this.buffers[i].get(index));
            }

            return res;
        }
    };

    /*get the nth element in the buffer*/
    Tree.prototype.get = function (index) {
        index -= this.historyBuffer.startIndex();
        return this.cbuffer.get(index);
    };


    /* append an array of elements to the buffer*/
    HistoryBuffer.prototype.appendArray = function (arr) {
        for (var i = 0; i < arr.length; i++) {
            this.pushNoStatsUpdate(arr[i]);
        }

        this.count += arr.length;

        this.changed = true;
        if (this.callOnChange) {
            this.callOnChange();
        }
    };

    /* get the tree node at the specified level that keeps the information for the specified index*/
    Tree.prototype.getTreeNode = function (level, index) {
        var treeLevel = this.tree.levels[level];
        var levelStep = treeLevel.step;
        var levelIndex = Math.floor((index - treeLevel.startIndex) / levelStep);

        if ((levelIndex < 0) || (levelIndex >= treeLevel.capacity)) {
            return null;
        }

        var node = treeLevel.nodes.get(levelIndex);

        return node;
    };

    /* get the tree nodes at the specified level that keeps the information for the specified interval*/
    HistoryBuffer.prototype.getTreeNodes = function (level, start, end) {
        var nodes = [];
        var treeLevel = this.tree.levels[level];
        var levelStep = treeLevel.step;

        var levelIndex = Math.floor((start - treeLevel.startIndex) / levelStep);

        if ((levelIndex < 0) || (levelIndex >= treeLevel.capacity) || levelIndex > end) {
            return nodes;
        }

        while (levelIndex < end) {
            if (levelIndex >= start) {
                nodes.push(treeLevel.nodes.get(levelIndex));
            }
            levelIndex += treeLevel.step;
        }

        return nodes;
    };

    /* returns an array with all the elements in the buffer*/
    HistoryBuffer.prototype.toArray = function () {
        if (this.width === 1) {
            return this.buffer.toArray();
        } else {
            var start = this.startIndex(),
                last = this.lastIndex(),
                res = [];
            for (var i = start; i < last; i++) {
                res.push(this.get(i));
            }
            return res;
        }
    };

    /* builds an empty acceleration tree*/
    Tree.prototype.buildEmptyAccelerationTree = function () {
        var hb = this.historyBuffer;
        var depth = Math.ceil(Math.log(hb.capacity) / Math.log(branchFactor)) - 1;
        if (depth < 1) {
            depth = 1;
        }

        var tree = {
            depth: depth,
            levels: []
        };

        for (var i = 0; i < depth; i++) {
            var tLevel = new TreeLevel(hb, i + 1);
            tree.levels.push(tLevel);
            for (var j = 0; j < tLevel.capacity; j++) {
                var node = new TreeNode();
                tLevel.nodes.push(node);
            }
        }

        return tree;
    };

    /*
     * Populate the upper levels of the tree, starting at the startingFromIndex.
     * All the tree levels should be already shifted as necessary before calling this function.
     */
    Tree.prototype.populateTreeLevel = function (startingFrom, level) {
        var hb = this.historyBuffer;
        var cbuffer = this.cbuffer;
        var startIndex = hb.startIndex(); // cache it
        var currentCount = 0;
        var i = 0;
        var firstSample = true;
        var node, max, maxIndex, min, minIndex;

        var minusOneLevel = {
            step: 1,
            startIndex: hb.startIndex()
        };

        var baseLevel = (level === 0) ? minusOneLevel : this.tree.levels[level - 1];
        var currentLevel = this.tree.levels[level];

        /* align starting from to a node in the base level boundary*/
        startingFrom = floorInBase(startingFrom, currentLevel.step);

        if (baseLevel.startIndex > startingFrom) {
            startingFrom = baseLevel.startIndex;
            currentCount = (startingFrom / baseLevel.step) % branchFactor;
        }

        for (i = startingFrom; i < hb.lastIndex(); i += baseLevel.step) {
            if (level === 0) {
                var val = cbuffer.get(i - startIndex); //this.get(i);

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
            } else {
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

    /* Rotate the history buffer to the left, updating the leftmost nodes in the tree with the new mins and maxes*/
    Tree.prototype.rotateTreeLevel = function (level) {
        var hb = this.historyBuffer;

        var startingIndex = hb.startIndex();
        var treeLevel = this.tree.levels[level];

        var alignedStartIndex = floorInBase(startingIndex, treeLevel.step);

        while (treeLevel.startIndex < alignedStartIndex) {
            treeLevel.rotate();
        }

        /* update the first node in the level */
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

    Tree.prototype.updateAccelerationTree = function () {
        var level;

        for (level = 0; level < this.tree.depth; level++) {
            this.rotateTreeLevel(level);
        }

        for (level = 0; level < this.tree.depth; level++) {
            this.populateTreeLevel(this.historyBuffer.lastUpdatedIndex, level);
        }

    };

    /* update the acceleration tree with the newly added values*/
    HistoryBuffer.prototype.updateAccelerationTrees = function () {
        var buffer = this.buffer;

        this.trees.forEach(function (tree) {
            tree.updateAccelerationTree();
        });

        this.lastUpdatedIndex = this.startIndex() + buffer.size;
        this.firstUpdatedIndex = this.startIndex();
    };

    HistoryBuffer.prototype.toSeries = function (index) {
        var buffer = this.buffer;

        var data = [];

        var start = this.startIndex();

        for (var i = 0; i < buffer.size; i++) {
            if (this.width > 1) {
                data.push([i + start, this.buffers[index].get(i)]);
            } else {
                data.push([i + start, buffer.get(i)]);
            }
        }

        return data;
    };

    HistoryBuffer.prototype.onChange = function (f) {
        this.callOnChange = f;
    };

    Tree.prototype.readMinMax = function (start, end) {
        var intervalSize = end - start;
        var startIndex = this.historyBuffer.startIndex();
        var cbuffer = this.cbuffer;

        var i;
        var minmax = {
            minIndex: start,
            min: cbuffer.get(start - startIndex),
            maxIndex: start,
            max: cbuffer.get(start - startIndex)
        };

        var level = Math.floor(Math.log(intervalSize) / Math.log(branchFactor));

        if (level === 0) {
            for (i = start; i < end; i++) {
                updateMinMaxFromValue(i, cbuffer.get(i - startIndex), minmax);
            }

            return minmax;
        }

        var step = Math.pow(branchFactor, level);
        var truncatedStart = Math.ceil(start / step) * step;
        var truncatedEnd = floorInBase(end, step);

        if (start !== truncatedStart) {
            minmax = this.readMinMax(start, truncatedStart);
        }

        if (end !== truncatedEnd) {
            updateMinMaxFromNode(this.readMinMax(truncatedEnd, end), minmax);
        }

        var truncatedBufferStart = floorInBase(this.historyBuffer.startIndex(), step);
        var begin = (truncatedStart - truncatedBufferStart) / step;
        var finish = (truncatedEnd - truncatedBufferStart) / step;

        for (i = begin; i < finish; i++) {
            updateMinMaxFromNode(this.tree.levels[level - 1].nodes.get(i), minmax);
        }

        return minmax;
    };

    /* get a decimated series, starting at the start sample, ending at the end sample with a provided step */
    HistoryBuffer.prototype.query = function (start, end, step) {
        if (this.changed) {
            this.updateAccelerationTrees();
            this.changed = false;
        }

        if (this.width === 1) {
            return this.tree.query(start, end, step);
        } else {
            var res = [];

            this.trees.forEach(function (tree) {
                res.push(tree.query(start, end, step));
            });

            return res;
        }
    };

    /* get a decimated series, starting at the start sample, ending at the end sample with a provided step */
    Tree.prototype.query = function (start, end, step) {
        var i;
        var hb = this.historyBuffer;
        var cbuffer = this.cbuffer;
        var startIndex = hb.startIndex(); // cache it

        var data = [];

        var firstIndex = hb.startIndex();
        var lastIndex = hb.lastIndex();

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
            var maxIndex, minIndex;
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

    // round to nearby lower multiple of base
    function floorInBase(n, base) {
        return base * Math.floor(n / base);
    }

    if (typeof module === 'object' && module.exports) {
        module.exports = HistoryBuffer;
    } else {
        global.HistoryBuffer = HistoryBuffer;
    }
})(this);