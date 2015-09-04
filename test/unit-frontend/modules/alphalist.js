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

    describe('The removeItemWithId fn', function() {

      it('should remove the item with the specified ID from the list', function() {
        var keys = 'ABC';
        var others = '#';
        var items = [
          { id: 1, firstName: 'A', lastName: 'A' },
          { id: 2, firstName: 'B', lastName: 'B' },
          { id: 3, firstName: 'C', lastName: 'C' },
          { id: 4, firstName: 'D', lastName: 'D' }
        ];

        var category = new this.CategoryService({keys: keys, sortBy: 'firstName', keepAll: true, keepAllKey: others});
        category.addItems(items);

        var categories = category.get();
        expect(categories.A).to.eql([items[0]]);

        category.removeItemWithId(1);
        expect(categories.A).to.eql([]);
      });

      it('should remove all items with the specified ID from the list', function() {
        var keys = 'A';
        var others = '#';
        var items = [
          { id: 1, firstName: 'A', lastName: 'A1' },
          { id: 2, firstName: 'A', lastName: 'Delete me' },
          { id: 2, firstName: 'A', lastName: 'Delete me' },
          { id: 3, firstName: 'A', lastName: 'A3' }
        ];

        var category = new this.CategoryService({keys: keys, sortBy: 'firstName', keepAll: true, keepAllKey: others});
        category.addItems(items);

        var categories = category.get();

        category.removeItemWithId(2);
        expect(categories).to.eql({
          A: [items[0], items[3]],
          '#': []
        });
      });

    });

    describe('The removeItem fn', function() {
      it('should remove the item from the list', function() {
        var item = {firstName: 'CBC', lastName: 'DEF'};
        var itemWithoutFirstname = {firstName: '', lastName: 'DDD'};

        var keys = 'ABC';
        var others = '#';
        var items = [
          {firstName: 'DBC', lastName: 'DEF'},
          item,
          {firstName: 'CAC', lastName: 'DEF'},
          itemWithoutFirstname,
          {firstName: 'aBC', lastName: 'DEF'},
          {firstName: 'EBC', lastName: 'DEF'},
          {firstName: 'zBC', lastName: 'DEF'}
        ];

        var category = new this.CategoryService({keys: keys, sortBy: 'firstName', keepAll: true, keepAllKey: others});
        category.addItems(items);
        category.removeItem(item);
        var categories = category.get();

        expect(categories.A).to.deep.equals([items[4]]);
        expect(categories.B).to.deep.equals([]);
        expect(categories.C).to.deep.equals([items[2]]);
        expect(categories[others]).to.deep.equals([itemWithoutFirstname, items[0], items[5], items[6]]);

        category.removeItem(itemWithoutFirstname);
        categories = category.get();
        expect(categories[others]).to.deep.equals([items[0], items[5], items[6]]);
      });

      it('should work when remove item with accents', function() {
        var keys = 'ABCE';
        var others = '#';
        var items = [
          { firstName: 'A', lastName: 'A' },
          { firstName: 'á', lastName: 'A' },
          { firstName: 'C', lastName: 'C' },
          { firstName: 'é', lastName: 'E' }
        ];

        var category = new this.CategoryService({keys: keys, sortBy: 'firstName', keepAll: true, keepAllKey: others});
        category.addItems(items);

        var categories = category.get();
        expect(categories.A).to.eql([items[0], items[1]]);

        category.removeItem(items[1]);
        expect(categories.A).to.eql([items[0]]);

        expect(categories.E).to.eql([items[3]]);
        category.removeItem(items[3]);
        expect(categories.E).to.eql([]);
      });

      it('should do nothing when no item found', function() {
        var keys = 'ABC';
        var others = '#';
        var items = [
          { firstName: 'A', lastName: 'A' },
          { firstName: 'B', lastName: 'B' },
          { firstName: 'C', lastName: 'C' },
          { firstName: 'D', lastName: 'D' }
        ];

        var category = new this.CategoryService({keys: keys, sortBy: 'firstName', keepAll: true, keepAllKey: others});
        category.addItems(items);
        var originalCategories = angular.copy(category.get());

        category.removeItem({ firstName: 'A', lastName: 'not A' });
        expect(category.get()).to.eql(originalCategories);

        category.removeItem({ firstName: 'D', lastName: 'not D' });
        expect(category.get()).to.eql(originalCategories);

        category.removeItem({ firstName: 'E', lastName: 'E' });
        expect(category.get()).to.eql(originalCategories);
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

      it('should add items with accents to the right categories', function() {

        var keys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var others = '#';
        var items = [
          {firstName: 'xavier', lastName: 'DEF'},
          {firstName: 'étienne', lastName: 'DEF'},
          {firstName: 'dBC', lastName: 'DEF'},
          {firstName: 'ffdsfd', lastName: 'DEF'},
          {firstName: 'Đoooo Đaaaaaa', lastName: 'DEF'},
          {firstName: 'đồ qsd', lastName: 'DEF'},
          {firstName: '_??~#', lastName: 'DEF'}
        ];

        var category = new this.CategoryService({keys: keys, sortBy: 'firstName', keepAll: true, keepAllKey: others});
        category.addItems(items);

        var categories = category.get();
        expect(categories.A).to.deep.equals([]);
        expect(categories.X).to.deep.equals([items[0]]);
        expect(categories.E).to.deep.equals([items[1]]);
        expect(categories.D).to.deep.equals([items[2], items[4], items[5]]);
        expect(categories.F).to.deep.equals([items[3]]);
        expect(categories[others]).to.deep.equals([items[6]]);
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
