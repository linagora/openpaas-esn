'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The esnCollaborationMembershipRequestsPaginationProvider service', function() {
  var data, provider, collaboration, options, esnCollaborationClientService, esnCollaborationMembershipRequestsPaginationProvider, $q, $rootScope;

  beforeEach(function() {
    collaboration = {objectType: 'chat.conversation', id: 1};
    options = {limit: 5, offset: 0};
    data = [];

    esnCollaborationClientService = {
      getRequestMemberships: sinon.spy(function() {
        return $q.when({data: data});
      })
    };

    angular.mock.module('esn.collaboration', function($provide) {
      $provide.constant('esnCollaborationClientService', esnCollaborationClientService);
    });
  });

  beforeEach(inject(function(_$q_, _$rootScope_, _esnCollaborationMembershipRequestsPaginationProvider_) {
    $rootScope = _$rootScope_;
    $q = _$q_;
    esnCollaborationMembershipRequestsPaginationProvider = _esnCollaborationMembershipRequestsPaginationProvider_;
  }));

  describe('The loadNextItems function', function() {

    beforeEach(function() {
      provider = new esnCollaborationMembershipRequestsPaginationProvider(collaboration, options);
    });

    afterEach(function() {
      provider = null;
    });

    it('should call with right parameters and set lastPage to false when result size is > input limit', function(done) {
      data = [1, 2, 3, 4, 5, 6];

      provider.loadNextItems().then(function(result) {
        expect(result.lastPage).to.be.false;
        expect(result.data).to.deep.equals(data);
        done();
      }, done);

      $rootScope.$digest();
    });

    it('should call with right parameters and set lastPage to false when result size is equal to input limit', function(done) {
      data = [1, 2, 3, 4, 5];

      provider.loadNextItems().then(function(result) {
        expect(result.lastPage).to.be.false;
        expect(result.data).to.deep.equals(data);
        done();
      }, done);

      $rootScope.$digest();
    });

    it('should call with right parameters and set lastPage to true when result size is < input limit', function(done) {
      data = [1, 2, 3];

      provider.loadNextItems().then(function(result) {
        expect(result.lastPage).to.be.true;
        expect(result.data).to.deep.equals(data);
        done();
      }, done);

      $rootScope.$digest();
    });
  });
});
