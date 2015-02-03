/* global $, describe, it, xit, after, beforeEach, afterEach, expect, jasmine, spyOn, HistoryBuffer */
/* jshint browser: true*/

describe('History Buffer', function () {
    'use strict';

    var plot;

    beforeEach(function () {
        jasmine.clock().install();
    });

    afterEach(function () {
        if (plot) {
            plot.shutdown();
        }
        $('#placeholder').empty();
        jasmine.clock().uninstall();
    });

    it('should have a capacity property', function () {
        var hb = new HistoryBuffer(10);

        expect(hb.capacity).toBe(10);
    });

    it('should have a setCapacity method', function () {
        var hb = new HistoryBuffer(10);

        hb.setCapacity(20);
        expect(hb.capacity).toBe(20);
    });

    it('should pop undefined when empty', function () {
        var hb = new HistoryBuffer(10);

        expect(hb.pop()).toBe(undefined);
    });

    it('should pop the last value in the buffer', function () {
        var hb = new HistoryBuffer(10);

        hb.buffer.push(1, 2, 3);

        expect(hb.pop()).toBe(3);
    });

    it('should have an appendArray method', function () {
        var hb = new HistoryBuffer(10);

        hb.appendArray([1, 2, 3]);

        [3, 2, 1, undefined].forEach(function (exp) {
            expect(hb.pop()).toBe(exp);
        });
    });

    it('should have a toArray method', function () {
        var hb = new HistoryBuffer(10);

        hb.appendArray([1, 2, 3]);

        expect(hb.toArray()).toEqual([1, 2, 3]);
    });

    it('should have a toArray method', function () {
        var hb = new HistoryBuffer(3);

        hb.appendArray([1, 2, 3]);
        hb.push(4);

        expect(hb.toArray()).toEqual([2, 3, 4]);
    });


});