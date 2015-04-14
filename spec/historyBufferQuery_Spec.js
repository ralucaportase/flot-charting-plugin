/* global $, describe, it, xit, after, beforeEach, afterEach, expect, jasmine, spyOn, HistoryBuffer */
/* jshint browser: true*/

/* brackets-xunit: includes=../lib/cbuffer.js,../jquery.flot.historybuffer.js */

describe('History Buffer Query', function () {
    'use strict';

    it('should have a query method', function () {
        var hb = new HistoryBuffer(10);

        expect(hb.query).toEqual(jasmine.any(Function));
    });

    it('should have basic query capabilities', function () {
        var hb = new HistoryBuffer(10);

        hb.push(5);

        expect(hb.query(0, 1, 1)).toEqual([[0, 5]]);
    });

    it('should return empty series when querying outside of the bounds', function () {
        var hb = new HistoryBuffer(10);

        hb.appendArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);

        expect(hb.query(12, 13, 1)).toEqual([]);
        expect(hb.query(0, 1, 1)).toEqual([]);
    });

    it('should return proper series after the buffer has slided', function () {
        var hb = new HistoryBuffer(10);

        hb.appendArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);

        expect(hb.query(10, 11, 1)).toEqual([[10, 10]]);
        expect(hb.query(0, 3, 1)).toEqual([[2, 2]]);
    });

    it('should return a decimated series for big buffers', function () {
        var size = 32768;
        var hb = new HistoryBuffer(size);

        for (var i = 0; i < size; i++) {
            hb.push(i);
        }

        expect(hb.query(0, 32768, 64).length).toBeGreaterThan(511);
        expect(hb.query(0, 32768, 64).length).toBeLessThan(1024);
    });

    it('should make sure that the acceleration structure is up to date', function () {
        var size = 32768;
        var hb = new HistoryBuffer(size);

        for (var i = 0; i < size; i++) {
            hb.push(i);
        }

        var res = hb.query(0, 32768, 64);
        expect(hb.query(0, 32768, 64).length).toBeGreaterThan(511);

        expect(hb.tree.levels[1].nodes[0].min).toBe(0);
        expect(hb.tree.levels[1].nodes[0].max).toBe(1023);
    });

});