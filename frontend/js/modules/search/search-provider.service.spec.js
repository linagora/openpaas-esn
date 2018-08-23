'use strict';

/* global chai: true */

var expect = chai.expect;

describe('The esnSearchProvider service', function() {
  var SearchProvider;

  beforeEach(function() {
    angular.mock.module('esn.search', 'jadeTemplates');
  });

  beforeEach(inject(function(_esnSearchProvider_) {
    SearchProvider = _esnSearchProvider_;
  }));

  describe('The constructor', function() {
    it('should throw error when name is not defined', function() {
      var test = function() {
        new SearchProvider({
          templateUrl: '/my/search/provider/result.html',
          uid: 'op.members'
        });
      };

      expect(test).to.throw('name is required for search provider');
    });

    it('should throw error when templateUrl is not defined', function() {
      var test = function() {
        new SearchProvider({
          name: 'My search provider',
          uid: 'op.members'
        });
      };

      expect(test).to.throw('templateUrl is required to render search result');
    });

    it('should throw error when uid is not defined', function() {
      var test = function() {
        new SearchProvider({
          name: 'My search provider',
          templateUrl: '/my/search/provider/result.html'
        });
      };

      expect(test).to.throw('uid is required for search provider');
    });
  });

  describe('The hasAdvancedSearch getter', function() {
    it('should return true when provider form is defined', function() {
      var provider = new SearchProvider({
        uid: 'uid',
        name: 'My search provider',
        templateUrl: '/my/search/provider/result.html',
        searchTemplateUrl: '/my/search/provider/form.html'
      });

      expect(provider.hasAdvancedSearch).to.be.true;
    });

    it('should return false when provider form is undefined', function() {
      var provider = new SearchProvider({
        uid: 'uid',
        name: 'My search provider',
        templateUrl: '/my/search/provider/result.html'
      });

      expect(provider.hasAdvancedSearch).to.be.false;
    });
  });
});
