/* global $, describe, it, xit, after, beforeEach, afterEach, expect, jasmine, spyOn, HistoryBuffer, jsc */
/* jshint browser: true*/

/* brackets-xunit: includes=../lib/cbuffer.js,../lib/jsverify.standalone.js,../lib/jasmineHelpers2.js,../jquery.flot.historybuffer.js */

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

        var res = hb.query(0, 32768, 64);
        expect(res.length).toBeGreaterThan(511);
        expect(res.length).not.toBeGreaterThan(1024);
        expect(res[0]).toEqual([0, 0]);
        expect(res[1]).toEqual([63, 63]);
    });

    it('should return a correctly decimated series for steps not multiple of 32', function () {
        var size = 32768;
        var hb = new HistoryBuffer(size);

        for (var i = 0; i < size; i++) {
            hb.push(i);
        }

        var res = hb.query(0, 32768, 99);
        expect(res[0]).toEqual([0, 0]);
        expect(res[1]).toEqual([98, 98]);
    });


    it('should make sure that the acceleration structure is up to date', function () {
        var size = 32768;
        var hb = new HistoryBuffer(size);

        for (var i = 0; i < size; i++) {
            hb.push(i);
        }

        var res = hb.query(0, 32768, 64);
        expect(hb.query(0, 32768, 64).length).toBeGreaterThan(511);

        expect(hb.tree.levels[1].nodes.get(0).min).toBe(0);
        expect(hb.tree.levels[1].nodes.get(0).max).toBe(1023);
    });

    it('should make sure that the acceleration structure is up to date after slide', function () {
        var size = 32768;
        var hb = new HistoryBuffer(size);

        for (var i = 0; i < size * 2; i++) {
            hb.push(i);
        }

        var res = hb.query(0, 32768, 64);
        expect(hb.query(32768, 65536, 64).length).toBeGreaterThan(511);

        expect(hb.tree.levels[1].nodes.get(0).min).toBe(32768);
        expect(hb.tree.levels[1].nodes.get(0).max).toBe(33791);
    });

    it('should use the acceleration structure to answer the queries', function () {
        var size = 32768;
        var hb = new HistoryBuffer(size);

        for (var i = 0; i < size; i++) {
            hb.push(i);
        }

        hb.query(0, 1, 1); // make sure the acceleration tree is up to date
        expect(hb.tree.levels[0].nodes.get(0).min).toBe(0);
        expect(hb.tree.levels[0].nodes.get(0).max).toBe(31);

        // tamper with the acceleration tree
        hb.tree.levels[0].nodes.get(0).min = -7;
        hb.tree.levels[0].nodes.get(0).minIndex = 77;
        hb.tree.levels[0].nodes.get(0).max = 99;
        hb.tree.levels[0].nodes.get(0).maxIndex = 99;

        // make sure the rigged data is present in the query results
        var res = hb.query(0, 32768, 32);

        expect(res[0]).toEqual([77, -7]);
        expect(res[1]).toEqual([99, 99]);
    });

    it('should give the same answer when using the queries vs toSeries with step 1', function () {
        var hbSize = 100;
        var hb;

        var property = jsc.forall(jsc.fatarray(jsc.number()), function (array) {
            hb = new HistoryBuffer(hbSize);

            for (var i = 0; i < array.length; i++) {
                hb.push(array[i]);
            }

            var toSeries = hb.toSeries();
            var query = hb.query(0, hb.count, 1);

            return JSON.stringify(toSeries) == JSON.stringify(query);
        });

        expect(property).toHold({
            size: 2 * hbSize
        });
    });

    it('should give the same answer when using the queries vs toSeries with step 10', function () {
        var hbSize = 100;
        var hb;
        var step = 10;

        var property = jsc.forall(jsc.fatarray(jsc.number()), function (array) {
            hb = new HistoryBuffer(hbSize);

            for (var i = 0; i < array.length; i++) {
                hb.push(array[i]);
            }

            var decimatedRes = decimateRawData(hb, step);
            var query = hb.query(0, hb.count, step);

            return JSON.stringify(decimatedRes) == JSON.stringify(query);
        });

        expect(property).toHold({
            size: 2 * hbSize,
            tests: 200
        });
    });

    describe('Acceleration tree update', function () {
        it('should recompute the minmax for a one level tree on push', function () {
            var hb = new HistoryBuffer(128);
            hb.push(1);

            hb.updateAccelerationTree();

            expect(hb.tree.levels[0].nodes.get(0).min).toBe(1);
            expect(hb.tree.levels[0].nodes.get(0).minIndex).toBe(0);
            expect(hb.tree.levels[0].nodes.get(0).max).toBe(1);
            expect(hb.tree.levels[0].nodes.get(0).maxIndex).toBe(0);
        });

        it('should recompute the minmax for a one level tree on fill', function () {
            var hb = new HistoryBuffer(64);
            for (var i = 0; i < 64; i++) {
                hb.push(i);
            }

            hb.updateAccelerationTree();

            expect(hb.tree.levels[0].nodes.get(0).min).toBe(0);
            expect(hb.tree.levels[0].nodes.get(0).minIndex).toBe(0);
            expect(hb.tree.levels[0].nodes.get(0).max).toBe(31);
            expect(hb.tree.levels[0].nodes.get(0).maxIndex).toBe(31);
            expect(hb.tree.levels[0].nodes.get(1).min).toBe(32);
            expect(hb.tree.levels[0].nodes.get(1).minIndex).toBe(32);
            expect(hb.tree.levels[0].nodes.get(1).max).toBe(63);
            expect(hb.tree.levels[0].nodes.get(1).maxIndex).toBe(63);
        });

        it('should compute the minmax for a one level tree on one element overwrite', function () {
            var hb = new HistoryBuffer(64);
            for (var i = 0; i < 65; i++) {
                hb.push(i);
            }

            hb.updateAccelerationTree();

            expect(hb.tree.levels[0].nodes.get(0).min).toBe(1);
            expect(hb.tree.levels[0].nodes.get(0).minIndex).toBe(1);
            expect(hb.tree.levels[0].nodes.get(0).max).toBe(31);
            expect(hb.tree.levels[0].nodes.get(0).maxIndex).toBe(31);
            expect(hb.tree.levels[0].nodes.get(1).min).toBe(32);
            expect(hb.tree.levels[0].nodes.get(1).minIndex).toBe(32);
            expect(hb.tree.levels[0].nodes.get(1).max).toBe(63);
            expect(hb.tree.levels[0].nodes.get(1).maxIndex).toBe(63);
            expect(hb.tree.levels[0].nodes.get(2).min).toBe(64);
            expect(hb.tree.levels[0].nodes.get(2).minIndex).toBe(64);
            expect(hb.tree.levels[0].nodes.get(2).max).toBe(64);
            expect(hb.tree.levels[0].nodes.get(2).maxIndex).toBe(64);
        });

        it('should compute the minmax for a one level tree on multiple elements overwrite', function () {
            var hb = new HistoryBuffer(64);
            for (var i = 0; i < 64 + 32; i++) {
                hb.push(i);
            }

            hb.updateAccelerationTree();

            expect(hb.tree.levels[0].nodes.get(0).min).toBe(32);
            expect(hb.tree.levels[0].nodes.get(0).minIndex).toBe(32);
            expect(hb.tree.levels[0].nodes.get(0).max).toBe(63);
            expect(hb.tree.levels[0].nodes.get(0).maxIndex).toBe(63);
            expect(hb.tree.levels[0].nodes.get(1).min).toBe(64);
            expect(hb.tree.levels[0].nodes.get(1).minIndex).toBe(64);
            expect(hb.tree.levels[0].nodes.get(1).max).toBe(95);
            expect(hb.tree.levels[0].nodes.get(1).maxIndex).toBe(95);
        });

        it('should recompute the minmax for a two level tree', function () {
            var hb = new HistoryBuffer(32 * 32 * 2);

            for (var i = 0; i < 2 * 32 * 32; i++) {
                hb.push(i);
            }

            hb.updateAccelerationTree();

            expect(hb.tree.levels.length).toEqual(2);
            expect(hb.tree.levels[1].nodes.size).toBe(3);
            expect(hb.tree.levels[1].nodes.get(0).min).toBe(0);
            expect(hb.tree.levels[1].nodes.get(0).max).toBe(1023);
            expect(hb.tree.levels[1].nodes.get(1).min).toBe(1024);
            expect(hb.tree.levels[1].nodes.get(1).max).toBe(2047);
        });
    });

    function decimateRawData(hb, step) {
        var toSeries = hb.toSeries();
        var decimatedRes = [];

        for (var i = 0; i < toSeries.length; i += step) {
            var section = toSeries.slice(i, i + step);

            section.sort(function (a, b) {
                return a[1] > b[1];
            }); // sort by data

            section.splice(1, section.length - 2); // remove everything except min and max

            section.sort(function (a, b) {
                return a[0] > b[0];
            }); // sort by index

            decimatedRes = decimatedRes.concat(section);
        }

        return decimatedRes;
    }
});