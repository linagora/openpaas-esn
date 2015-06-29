'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Alpha List module', function() {
  beforeEach(angular.mock.module('esn.alphalist'));

  describe('AlphaCategoryService service', function() {

    beforeEach(module('duScroll'));
    beforeEach(angular.mock.inject(function(AlphaCategoryService) {
      this.CategoryService = AlphaCategoryService;
    }));

    describe('when instantiating', function() {

      it('should initialize the categories', function() {
        var keys = 'ABC';
        var category = new this.CategoryService({keys: keys});
        var categories = category.get();
        expect(categories.A).to.be.an.array;
        expect(categories.B).to.be.an.array;
        expect(categories.C).to.be.an.array;
      });

      it('should create a category for items which are not in initial keys', function() {
        var keys = 'ABC';
        var others = '###';
        var category = new this.CategoryService({keys: keys, keepAll: true, keepAllKey: others});
        var categories = category.get();
        expect(categories[others]).to.be.an.array;
      });
    });

    describe('the removeItem function', function() {
      it('should remove the item from the list', function() {
        var item = {firstName: 'CBC', lastName: 'DEF'};

        var keys = 'ABC';
        var others = '#';
        var items = [
          {firstName: 'DBC', lastName: 'DEF'},
          item,
          {firstName: 'CAC', lastName: 'DEF'},
          {firstName: 'aBC', lastName: 'DEF'},
          {firstName: 'EBC', lastName: 'DEF'},
          {firstName: 'zBC', lastName: 'DEF'}
        ];

        var category = new this.CategoryService({keys: keys, sortBy: 'firstName', keepAll: true, keepAllKey: others});
        category.addItems(items);
        category.removeItem(item);
        var categories = category.get();

        expect(categories.A).to.deep.equals([items[3]]);
        expect(categories.B).to.deep.equals([]);
        expect(categories.C).to.deep.equals([items[2]]);
        expect(categories[others]).to.deep.equals([items[0], items[4], items[5]]);
      });
    });

    describe('the addItems function', function() {
      it('should add the items to the right categories', function() {

        var keys = 'ABC';
        var others = '#';
        var items = [
          {firstName: 'DBC', lastName: 'DEF'},
          {firstName: 'CBC', lastName: 'DEF'},
          {firstName: 'CAC', lastName: 'DEF'},
          {firstName: 'aBC', lastName: 'DEF'},
          {firstName: 'EBC', lastName: 'DEF'},
          {firstName: 'zBC', lastName: 'DEF'}
        ];

        var category = new this.CategoryService({keys: keys, sortBy: 'firstName', keepAll: true, keepAllKey: others});
        category.addItems(items);

        var categories = category.get();
        expect(categories.A).to.deep.equals([items[3]]);
        expect(categories.B).to.deep.equals([]);
        expect(categories.C).to.deep.equals([items[2], items[1]]);
        expect(categories[others]).to.deep.equals([items[0], items[4], items[5]]);
      });

      it('should not keep unknown items', function() {

        var keys = 'ABC';
        var others = '#';
        var items = [
          {firstName: 'DBC', lastName: 'DEF'},
          {firstName: 'CBC', lastName: 'DEF'},
          {firstName: 'CAC', lastName: 'DEF'},
          {firstName: 'aBC', lastName: 'DEF'},
          {firstName: 'EBC', lastName: 'DEF'},
          {firstName: 'zBC', lastName: 'DEF'}
        ];

        var category = new this.CategoryService({keys: keys, sortBy: 'firstName', keepAll: false, keepAllKey: others});
        category.addItems(items);
        var categories = category.get();
        expect(categories.A).to.deep.equals([items[3]]);
        expect(categories.B).to.deep.equals([]);
        expect(categories.C).to.deep.equals([items[2], items[1]]);
        expect(categories[others]).to.not.exist;
      });

      it('should add items to the existing categories when calling addItems several times', function() {

        var keys = 'ABC';
        var items = [
          {firstName: 'CBC', lastName: 'DEF'},
          {firstName: 'BAC', lastName: 'DEF'},
          {firstName: 'aBC', lastName: 'DEF'}
        ];

        var category = new this.CategoryService({keys: keys, sortBy: 'firstName'});
        category.addItems(items);

        var categories = category.get();
        expect(categories.A).to.have.length(1);
        expect(categories.B).to.have.length(1);
        expect(categories.C).to.have.length(1);

        var newItems = [
          {firstName: 'CDC', lastName: 'DEF'},
          {firstName: 'AC', lastName: 'DEF'}
        ];

        category.addItems(newItems);
        categories = category.get();
        expect(categories.A).to.have.length(2);
        expect(categories.B).to.have.length(1);
        expect(categories.C).to.have.length(2);
      });
    });
  });
});
