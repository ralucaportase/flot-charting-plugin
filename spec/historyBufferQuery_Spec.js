/* global $, describe, it, xit, after, beforeEach, afterEach, expect, jasmine, spyOn, HistoryBuffer */
/* jshint browser: true*/

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

});