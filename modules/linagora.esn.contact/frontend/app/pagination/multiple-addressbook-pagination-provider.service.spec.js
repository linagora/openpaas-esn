'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The MultipleAddressBookPaginationProvider service', function() {
  var PageAggregatorServiceMock;

  beforeEach(function() {
    PageAggregatorServiceMock = function() {};

    module('linagora.esn.contact', function($provide) {
      $provide.value('PageAggregatorService', PageAggregatorServiceMock);
    });
  });

  beforeEach(angular.mock.inject(function(MultipleAddressBookPaginationProvider, $rootScope) {
    this.$rootScope = $rootScope;
    this.MultipleAddressBookPaginationProvider = MultipleAddressBookPaginationProvider;
  }));

  it('should throw error when options.addressbooks is undefined', function(done) {
    try {
      new this.MultipleAddressBookPaginationProvider({});
      done(new Error());
    } catch (e) {
      expect(e.message).to.match(/options.addressbooks array is required/);
      done();
    }
  });

  it('should throw error when options.addressbooks is empty', function(done) {
    try {
      new this.MultipleAddressBookPaginationProvider({
        addressbooks: []
      });
      done(new Error());
    } catch (e) {
      expect(e.message).to.match(/options.addressbooks array is required/);
      done();
    }
  });

  it('should create all the required resources', function() {
    var options = {
      addressbooks: [{ id: 1 }, { id: 2 }, { id: 3 }]
    };

    var provider = new this.MultipleAddressBookPaginationProvider(options);
    expect(provider.providers.length).to.equal(options.addressbooks.length);
    expect(provider.aggregator).to.be.defined;
  });

  it('should use the options comparator when defined', function() {
    var options = {
      addressbooks: [{ id: 1 }, { id: 2 }, { id: 3 }],
      compare: 'MyAwesomeComparator'
    };

    var provider = new this.MultipleAddressBookPaginationProvider(options);
    expect(provider.compare).to.equal(options.compare);
  });

  describe('The loadNextItems function', function() {
    it('should call the age aggregator service', function(done) {
      var options = {
        addressbooks: [{ id: 1 }, { id: 2 }, { id: 3 }]
      };

      PageAggregatorServiceMock.prototype.loadNextItems = done;
      var provider = new this.MultipleAddressBookPaginationProvider(options);
      provider.loadNextItems();
      done(new Error());
    });
  });
});
