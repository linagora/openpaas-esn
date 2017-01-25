'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The esnCollaborationMemberPaginationProvider service', function() {
  var data, provider, collaboration, options, esnCollaborationClientService, esnCollaborationMemberPaginationProvider, $q, $rootScope;

  beforeEach(function() {
    collaboration = {objectType: 'chat.conversation', id: 1};
    options = {limit: 5, offset: 0};
    data = [];

    esnCollaborationClientService = {
      getMembers: sinon.spy(function() {
        return $q.when({data: data});
      })
    };

    angular.mock.module('esn.collaboration', function($provide) {
      $provide.constant('esnCollaborationClientService', esnCollaborationClientService);
    });
  });

  beforeEach(inject(function(_$q_, _$rootScope_, _esnCollaborationMemberPaginationProvider_) {
    $rootScope = _$rootScope_;
    $q = _$q_;
    esnCollaborationMemberPaginationProvider = _esnCollaborationMemberPaginationProvider_;
  }));

  describe('The loadNextItems function', function() {

    beforeEach(function() {
      provider = new esnCollaborationMemberPaginationProvider(collaboration, options);
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
