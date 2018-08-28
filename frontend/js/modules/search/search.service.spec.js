'use strict';

/* global chai, sinon: true */

var expect = chai.expect;

describe('The esnSearchService service', function() {
  var esnSearchService, $state, query, provider;

  beforeEach(function() {
    angular.mock.module('esn.search', 'jadeTemplates');
  });

  beforeEach(function() {
    query = {};
    provider = {};
    $state = {
      current: {
        name: 'search.main'
      },
      go: sinon.spy()
    };

    angular.mock.module('esn.search', function($provide) {
      $provide.value('$state', $state);
    });
  });

  beforeEach(inject(function(_esnSearchService_) {
    esnSearchService = _esnSearchService_;
  }));

  describe('The search function', function() {
    it('should put the search text in the state parameters when search is simple', function() {
      query.text = 'Search me';
      esnSearchService.search(query, provider);

      expect($state.go).to.have.been.calledWith('search.main', {
        a: null,
        p: undefined,
        q: query.text
      }, {
        location: 'replace',
        reload: true
      });
    });

    it('should empty the simple search text when search is advanced', function() {
      provider = { uid: 'op.inbox' };
      query.text = 'Search me';
      query.advanced = { from: 'me' };
      esnSearchService.search(query, provider);

      expect($state.go).to.have.been.calledWith('search.main', {
        a: query.advanced,
        p: provider.uid,
        q: ''
      }, {
        location: 'replace',
        reload: true
      });
    });

    it('should empty the advanced search when provider is not defined', function() {
      query.advanced = { from: 'me' };
      esnSearchService.search(query, provider);

      expect($state.go).to.have.been.calledWith('search.main', {
        a: null,
        p: undefined,
        q: ''
      }, {
        location: 'replace',
        reload: true
      });
    });

    it('should put the advanced search object in state parameters when defined and provider is defined', function() {
      provider = { uid: 'op.inbox' };
      query.advanced = { from: 'me' };
      esnSearchService.search(query, provider);

      expect($state.go).to.have.been.calledWith('search.main', {
        a: query.advanced,
        p: provider.uid,
        q: ''
      }, {
        location: 'replace',
        reload: true
      });
    });

    it('should not put the provider in state parameters when its uid is not defined', function() {
      provider = { notuid: 'op.inbox' };
      query.text = 'Search me';
      esnSearchService.search(query, provider);

      expect($state.go).to.have.been.calledWith('search.main', {
        a: null,
        p: undefined,
        q: query.text
      }, {
        location: 'replace',
        reload: true
      });
    });
  });
});
