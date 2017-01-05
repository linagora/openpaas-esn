'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.registry Angular module', function() {

  beforeEach(angular.mock.module('esn.registry'));

  describe('The esnRegistry factory', function() {

    var esnRegistry;

    beforeEach(inject(function(_esnRegistry_) {
      esnRegistry = _esnRegistry_;
    }));

    it('should initialize the registry on first access, then reuse the instance', function() {
      esnRegistry('test').add({name: 'object'}); // default primaryKey

      expect(esnRegistry('test').get('object').name).to.equals('object');
    });

    it('should provide a way to get all registered items', function() {
      var registry = esnRegistry('test');

      registry.add({name: '1'});
      registry.add({name: '3'});
      registry.add({name: '2'});

      expect(registry.getAll()).to.deep.equal({
        1: {name: '1'},
        2: {name: '2'},
        3: {name: '3'}
      });
    });

    it('should support a custom primaryKey for items', function() {
      var registry = esnRegistry('test', {primaryKey: 'id'});

      registry.add({id: '1', name: 'name1'});
      registry.add({id: '2'});

      expect(registry.get('2')).to.deep.equal({id: '2'});
      expect(registry.get('name1')).to.equal(undefined);
    });

    it('should support a custom match function', function() {
      var registry = esnRegistry('test', {
        primaryKey: 'id',
        match: function(key, item) {
          return item.lastname === key;
        }
      });

      registry.add({id: '1', firstname: 'first1', lastname: 'last1'});
      registry.add({id: '2', firstname: 'first2', lastname: 'last2'});

      expect(registry.get('last1').id).to.equal('1');
      expect(registry.get('2')).to.equal(undefined);
    });

  });

});
