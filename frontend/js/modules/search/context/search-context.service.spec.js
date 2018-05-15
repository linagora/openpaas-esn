'use strict';

/* global chai, sinon: true */

var expect = chai.expect;

describe('The esnSearchContextService service', function() {
  var $rootScope, $state, $q, searchProviders, esnSearchContextService;

  beforeEach(function() {
    $state = {
      includes: sinon.stub()
    };
    searchProviders = {
      getAll: sinon.stub()
    };

    angular.mock.module('esn.search', function($provide) {
      $provide.value('$state', $state);
      $provide.value('searchProviders', searchProviders);
    });
  });

  beforeEach(inject(function(_esnSearchContextService_, _$q_, _$rootScope_) {
    esnSearchContextService = _esnSearchContextService_;
    $q = _$q_;
    $rootScope = _$rootScope_;
  }));

  describe('The isActive function', function() {
    it('should return false when provider does not have activeOn property', function() {
      var provider = {};

      expect(esnSearchContextService.isActive(provider)).to.be.false;
      expect($state.includes).to.not.have.been.called;
    });

    it('should return false when activeOn array is empty', function() {
      var provider = {activeOn: []};

      expect(esnSearchContextService.isActive(provider)).to.be.false;
      expect($state.includes).to.not.have.been.called;
    });

    it('should return false if current state is not included in activeOn array', function() {
      var provider = {activeOn: ['foo', 'bar', 'baz']};

      $state.includes.returns(false);

      expect(esnSearchContextService.isActive(provider)).to.be.false;
      expect($state.includes).to.have.been.calledThrice;
    });

    it('should return true when current state is defined in one activeOn element', function() {
      var provider = {activeOn: ['foo', 'bar', 'baz']};

      $state.includes.onFirstCall().returns(true);
      $state.includes.returns(false);

      expect(esnSearchContextService.isActive(provider)).to.be.true;
      expect($state.includes).to.have.been.calledOnce;
    });

    it('should return true when current state is defined in more than one activeOn element', function() {
      var provider = {activeOn: ['foo', 'bar', 'baz']};

      $state.includes.onSecondCall().returns(true);
      $state.includes.returns(false);

      expect(esnSearchContextService.isActive(provider)).to.be.true;
      expect($state.includes).to.have.been.calledTwice;
    });
  });

  describe('The getProvidersContext function', function() {
    beforeEach(function() {
      $state.includes.returns(false);
    });

    it('should reject when searchProviders.getAll rejects', function(done) {
      searchProviders.getAll.returns($q.reject(new Error()));

      esnSearchContextService.getProvidersContext().then(function() {
        done(new Error('Should not occur'));
      }, function() {
        done();
      });

      $rootScope.$digest();
    });

    it('should resolve with the mapped providers', function(done) {
      var providers = [
        {id: 1, name: 'emailsearchprovider'},
        {id: 2, name: 'contactsearchprovider'}
      ];

      searchProviders.getAll.returns($q.when(providers));

      esnSearchContextService.getProvidersContext().then(function(result) {
        expect(result).to.shallowDeepEqual([
          {id: 1, name: 'emailsearchprovider', active: false},
          {id: 2, name: 'contactsearchprovider', active: false}
        ]);
        done();
      }, function() {
        done(new Error('Should not occur'));
      });
      $rootScope.$digest();
    });
  });
});
