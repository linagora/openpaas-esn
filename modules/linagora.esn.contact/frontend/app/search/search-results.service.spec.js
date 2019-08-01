'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The contactSearchResultsProviderSubmit service', function() {
  var $state,
    stateParams,
    contactSearchResultsProviderSubmit,
    searchProvider,
    query;

  beforeEach(function() {
    module('linagora.esn.contact');
    query = {};
    stateParams = {};
    inject(function(_$state_) {
      $state = _$state_;
      $state.current.name = 'contact.search';
      $state.go = sinon.spy();
    });
  });

  beforeEach(inject(function(_contactSearchResultsProviderSubmit_) {
    contactSearchResultsProviderSubmit = _contactSearchResultsProviderSubmit_;
  }));

  beforeEach((function() {
    searchProvider = sinon.stub().returns(contactSearchResultsProviderSubmit);
  }));

  describe('when submitted search contact,', function() {
    it('it should go contact.search', function() {
      query.text = 'Search me';

      searchProvider($state)(query, stateParams, {});
      expect($state.go).to.have.been.calledWith(
        'contact.search',
        { account: '', context: '' },
        { location: 'replace', reload: true }
      );
    });
  });
});
