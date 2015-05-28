/* global describe, it, xit, expect, jasmine, HistoryBuffer */
/* jshint browser: true*/

/* brackets-xunit: includes=../lib/cbuffer.js,../jquery.flot.historybuffer.js* */

describe('History Buffer', function () {
    'use strict';

    it('should have a capacity property', function () {
        var hb = new HistoryBuffer(10);

        expect(hb.capacity).toBe(10);
    });

    it('should have a setCapacity method', function () {
        var hb = new HistoryBuffer(10);

        hb.setCapacity(20);
        expect(hb.capacity).toBe(20);
    });

    it('should have an appendArray method', function () {
        var hb = new HistoryBuffer(10);

        hb.appendArray([1, 2, 3]);

        [1, 2, 3, undefined].forEach(function (exp, i) {
            expect(hb.get(i)).toBe(exp);
        });
    });

    xit('appendArray method should work with arrays bigger that the hb capacity', function () {
        var hb = new HistoryBuffer(3);

        hb.appendArray([1, 2, 3, 4]);

        [2, 3, 4, undefined].forEach(function (exp, i) {
            expect(hb.get(i + 1)).toBe(exp);
        });
    });

    it('the appendArray method should work for plots with two data series', function () {
        var hb = new HistoryBuffer(10, 2);

        hb.appendArray([[1, 1], [2, 2], [3, 3]]);

        [[1, 1], [2, 2], [3, 3], [undefined, undefined]].forEach(function (exp, i) {
            expect(hb.get(i)).toEqual(exp);
        });
    });

    it('should have a toArray method', function () {
        var hb = new HistoryBuffer(10);

        hb.appendArray([1, 2, 3]);

        expect(hb.toArray()).toEqual([1, 2, 3]);
    });

    it('toArray method should work for plots with two data series', function () {
        var hb = new HistoryBuffer(10, 2);

        hb.appendArray([[1, 2], [2, 3], [3, 4]]);

        expect(hb.toArray()).toEqual([[1, 2], [2, 3], [3, 4]]);
    });


    describe('Acceleration tree', function () {
        it('should be created on hb creation', function () {
            var hb = new HistoryBuffer(128);

            expect(hb.tree).toEqual(jasmine.any(Object));
        });

        it('should have multiple acceleration trees for muliple data series', function () {
            var hb = new HistoryBuffer(128, 2);

            expect(hb.trees[0]).toEqual(jasmine.any(Object));
            expect(hb.trees[0]).toEqual(jasmine.any(Object));
        });

        describe('One level deep', function () {
            it('should compute the max and min correctly for tree elements', function () {
                var hb = new HistoryBuffer(10);

                hb.appendArray([1, 2, 3]);

                hb.updateAccelerationTrees();

                var firstTree = hb.trees[0].tree;

                expect(firstTree.depth).toEqual(1);
                expect(firstTree.levels).toEqual(jasmine.any(Array));
                expect(firstTree.levels.length).toEqual(1);
                expect(firstTree.levels[0].nodes.size).toBe(2);
                expect(firstTree.levels[0].nodes.get(0).min).toBe(1);
                expect(firstTree.levels[0].nodes.get(0).max).toBe(3);
            });


            it('should compute the max and min correctly for tree elements, two data series', function () {
                var hb = new HistoryBuffer(10, 2);

                hb.appendArray([[1, 10], [2, 20], [3, 30]]);

                hb.updateAccelerationTrees();
                var firstTree = hb.trees[0].tree;
                var secondTree = hb.trees[1].tree;

                expect(firstTree.depth).toEqual(1);
                expect(secondTree.depth).toEqual(1);
                expect(firstTree.levels).toEqual(jasmine.any(Array));
                expect(secondTree.levels).toEqual(jasmine.any(Array));
                expect(firstTree.levels.length).toEqual(1);
                expect(secondTree.levels.length).toEqual(1);
                expect(firstTree.levels[0].nodes.size).toBe(2);
                expect(secondTree.levels[0].nodes.size).toBe(2);
                expect(firstTree.levels[0].nodes.get(0).min).toBe(1);
                expect(secondTree.levels[0].nodes.get(0).min).toBe(10);
                expect(firstTree.levels[0].nodes.get(0).max).toBe(3);
                expect(secondTree.levels[0].nodes.get(0).max).toBe(30);
            });


            it('should compute the max and min correctly for 64 elements', function () {
                var hb = new HistoryBuffer(128);

                for (var i = 0; i < 64; i++) {
                    hb.push(i);
                }

                hb.updateAccelerationTrees();
                var firstTree = hb.trees[0].tree;

                expect(firstTree.depth).toEqual(1);
                expect(firstTree.levels).toEqual(jasmine.any(Array));
                expect(firstTree.levels.length).toEqual(1);
                expect(firstTree.levels[0].nodes.size).toBe(5);
                expect(firstTree.levels[0].nodes.get(0).min).toBe(0);
                expect(firstTree.levels[0].nodes.get(0).max).toBe(31);
                expect(firstTree.levels[0].nodes.get(1).min).toBe(32);
                expect(firstTree.levels[0].nodes.get(1).max).toBe(63);
            });
        });

        describe('Two levels deep', function () {
            it('should create a proper acceleration tree with two levels', function () {
                var hb = new HistoryBuffer(32 * 32 * 2);

                expect(hb.tree.tree.depth).toEqual(2);
            });

            it('should create proper acceleration trees with two levels on multiple data series', function () {
                var hb = new HistoryBuffer(32 * 32 * 2, 2);

                expect(hb.tree.tree.depth).toEqual(2);
                expect(hb.trees[1].tree.depth).toEqual(2);
            });

            it('should compute the max and min correctly for 2048 elements', function () {
                var hb = new HistoryBuffer(32 * 32 * 2);

                for (var i = 0; i < 2 * 32 * 32; i++) {
                    hb.push(i);
                }

                hb.updateAccelerationTrees();
                var firstTree = hb.trees[0].tree;

                expect(firstTree.levels).toEqual(jasmine.any(Array));
                expect(firstTree.levels.length).toEqual(2);
                expect(firstTree.levels[1].nodes.size).toBe(3);
                expect(firstTree.levels[1].nodes.get(0).min).toBe(0);
                expect(firstTree.levels[1].nodes.get(0).max).toBe(1023);
                expect(firstTree.levels[1].nodes.get(1).min).toBe(1024);
                expect(firstTree.levels[1].nodes.get(1).max).toBe(2047);
            });
        });

        describe('Three levels deep', function () {
            it('should create a proper acceleration tree with three levels', function () {
                var hb = new HistoryBuffer(32 * 32 * 32 * 2);

                expect(hb.tree.tree.depth).toEqual(3);
            });

            it('should create proper acceleration trees with three levels on multiple data series', function () {
                var hb = new HistoryBuffer(32 * 32 * 32 * 2, 3);

                expect(hb.tree.tree.depth).toEqual(3);
                expect(hb.trees[1].tree.depth).toEqual(3);
            });

            it('should compute the max and min correctly for 65536 elements', function () {
                var hb = new HistoryBuffer(32 * 32 * 32 * 2);

                for (var i = 0; i < 2 * 32 * 32 * 32; i++) {
                    hb.push(i);
                }

                hb.updateAccelerationTrees();
                var firstTree = hb.trees[0].tree;

                expect(firstTree.levels).toEqual(jasmine.any(Array));
                expect(firstTree.levels.length).toEqual(3);
                expect(firstTree.levels[2].nodes.length).toBe(3);
                expect(firstTree.levels[2].nodes.get(0).min).toBe(0);
                expect(firstTree.levels[2].nodes.get(0).max).toBe(32767);
                expect(firstTree.levels[2].nodes.get(1).min).toBe(32768);
                expect(firstTree.levels[2].nodes.get(1).max).toBe(65535);
            });
        });
    });
});