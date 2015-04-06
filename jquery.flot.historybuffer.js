/* history buffers datastructure for charting.

Copyright (c) 2007-2015 National Instruments
Licensed under the MIT license.
*/
/*globals $, CBuffer, module*/

$(function (global) {
    'use strict';

    /* Chart History buffer */
    var HistoryBuffer = function (capacity, width) {
        this.capacity = capacity || 1024;
        this.width = width || 1;
        this.buffer = new CBuffer(capacity); /* circular buffer */
        this.count = 0;
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
        for (var i = 0; i < arr.length; i++ ) { 
            this.buffer.push(arr[i]);
        };
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