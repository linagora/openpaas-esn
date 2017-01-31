'use strict';

/* global expect, sinon: false */

describe('The esnPaginationProvider factory', function() {
  var esnPaginationProvider, $rootScope, $q;

  beforeEach(function() {
    angular.mock.module('esn.pagination');
  });

  beforeEach(inject(function(_$q_, _$rootScope_, _esnPaginationProvider_) {
    $rootScope = _$rootScope_;
    $q = _$q_;
    esnPaginationProvider = _esnPaginationProvider_;
  }));

  describe('The loadNextItems function', function() {
    it('should call the given paginable', function() {
      var paginable = sinon.spy(function() {
        return $q.when({data: []});
      });
      var provider = new esnPaginationProvider(paginable, {});

      provider.loadNextItems();
      $rootScope.$digest();

      expect(paginable).to.have.been.calledOnce;
    });

    it('should set the lastPage property to true when returned data length is < input limit', function() {
      var thenSpy = sinon.spy();
      var data = [1];
      var paginable = sinon.spy(function() {
        return $q.when({data: data});
      });
      var options = { limit: 5, offset: 0 };
      var provider = new esnPaginationProvider(paginable, options);

      provider.loadNextItems().then(thenSpy);
      $rootScope.$digest();

      expect(thenSpy).to.have.been.calledWith({data: data, lastPage: true});
    });

    it('should set the lastPage property to false when returned data length is = input limit', function() {
      var data = [1, 2, 3, 4, 5];
      var thenSpy = sinon.spy();
      var paginable = sinon.spy(function() {
        return $q.when({data: data});
      });
      var options = { limit: 5, offset: 0 };
      var provider = new esnPaginationProvider(paginable, options);

      provider.loadNextItems().then(thenSpy);
      $rootScope.$digest();

      expect(thenSpy).to.have.been.calledWith({data: data, lastPage: false});
    });

    it('should call the paginable with updated offset when the lastPage property is false after first call', function() {
      var options = { limit: 5, offset: 0 };
      var paginable = sinon.spy(function() {
        return $q.when({data: [1, 2, 3, 4, 5]});
      });

      var firstCall = paginable.withArgs(sinon.match({offset: 0, limit: 5}));
      var secondCall = paginable.withArgs(sinon.match({offset: 5, limit: 5}));

      var provider = new esnPaginationProvider(paginable, options);

      provider.loadNextItems();
      $rootScope.$digest();

      provider.loadNextItems();
      $rootScope.$digest();

      expect(paginable).to.have.been.calledTwice;
      expect(firstCall).to.have.been.calledOnce;
      expect(secondCall).to.have.been.calledOnce;
      expect(firstCall).to.have.been.calledBefore(secondCall);
    });
  });
});
