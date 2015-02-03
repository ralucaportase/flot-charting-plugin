/*globals $, CBuffer, module*/

$(function (global) {
    'use strict';

    /* Chart History buffer */
    var HistoryBuffer = function (capacity, width) {
        this.capacity = capacity || 1024;
        this.width = width || 1;
        this.buffer = new CBuffer(capacity); /* circular buffer */
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
    };

    HistoryBuffer.prototype.appendArray = function (arr) {
        // TO DO make the implementation fast
        var buffer = this.buffer;
        arr.forEach(function (item) {
            buffer.push(item);
        });
    };

    HistoryBuffer.prototype.toArray = function () {
        // TO DO make the implementation fast
        var buffer = this.buffer;

        return buffer.toArray();
    };

    if (typeof module === 'object' && module.exports) module.exports = HistoryBuffer;
    else global.HistoryBuffer = HistoryBuffer;
}(this));