'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The communityListController controller', function() {
  beforeEach(inject(function($rootScope, $controller) {
    this.communityAPI = {
      list: function() {
        return {
          then: function() {
            return {
              finally: function() {}
            };
          }
        };
      }
    };
    this.userAPI = {
      getCommunities: function() {
        return {
          then: function() {
            return {
              finally: function() {
              }
            };
          }
        };
      }
    };
    this.domain = {_id: 123};
    this.user = {_id: 456};
    this.scope = $rootScope.$new();
    this.log = {
      error: function() {
      }
    };
    this.location = {};

    angular.mock.module('esn.community');
    angular.mock.module('esn.user');
    module('jadeTemplates');

    $controller('communityListController', {
      $scope: this.scope,
      $log: this.log,
      $location: this.location,
      domain: this.domain,
      user: this.user,
      communityAPI: this.communityAPI,
      userAPI: this.userAPI
    });
  }));

  describe('getAll() method', function() {
    it('should call communityAPI#list', function(done) {
      this.communityAPI.list = function() {
        return done();
      };
      this.scope.getAll();
    });

    it('should set the $scope.communities with communityAPI#list result', function(done) {
      var result = [{_id: 123}, {_id: 234}];
      this.communityAPI.list = function() {
        return $q.when({data: result});
      };
      this.scope.getAll();
      this.scope.$digest();
      expect(this.scope.communities).to.deep.equal(result);
      done();
    });

    it('should set $scope.error to true when communityAPI#list fails', function(done) {
      this.communityAPI.list = function() {
        return $q.reject({err: 'failed'});
      };
      this.scope.getAll();
      this.scope.$digest();
      expect(this.scope.error).to.be.true;
      done();
    });

    it('should set $scope.selected to all', function(done) {
      this.communityAPI.list = function() {
        return $q.reject({err: 'failed'});
      };
      this.scope.getAll();
      this.scope.$digest();
      expect(this.scope.selected).to.equal('all');
      done();
    });
  });

  describe('getModerator() method', function() {
    it('should call communityAPI#list fn', function(done) {
      this.communityAPI.list = function() {
        return done();
      };
      this.scope.getModerator();
    });

    it('should set the $scope.communities with communityAPI#list result', function(done) {
      var result = [{_id: 123}, {_id: 234}];
      this.communityAPI.list = function() {
        return $q.when({ data: result });
      };
      this.scope.getModerator();
      this.scope.$digest();
      expect(this.scope.communities).to.deep.equal(result);
      done();
    });

    it('should set $scope.error to true when communityAPI#list fails', function(done) {
      this.communityAPI.list = function() {
        return $q.reject({ err: 'failed' });
      };
      this.scope.getModerator();
      this.scope.$digest();
      expect(this.scope.error).to.be.true;
      done();
    });

    it('should set $scope.selected to moderator', function(done) {
      this.communityAPI.list = function() {
        return $q.reject({err: 'failed'});
      };
      this.scope.getModerator();
      this.scope.$digest();
      expect(this.scope.selected).to.equal('moderator');
      done();
    });
  });

  describe('getMembership() method', function() {
    it('should call userAPI#getCommunities fn', function(done) {
      this.userAPI.getCommunities = function() {
        return done();
      };
      this.scope.getMembership();
    });

    it('should set the $scope.communities with userAPI#getCommunities result', function(done) {
      var result = [{_id: 123}, {_id: 234}];
      this.userAPI.getCommunities = function() {
        return $q.when({ data: result });
      };
      this.scope.getMembership();
      this.scope.$digest();
      expect(this.scope.communities).to.deep.equal(result);
      done();
    });

    it('should set $scope.error to true when userAPI#getCommunities fails', function(done) {
      this.userAPI.getCommunities = function() {
        return $q.reject({ err: 'failed' });
      };
      this.scope.getMembership();
      this.scope.$digest();
      expect(this.scope.error).to.be.true;
      done();
    });

    it('should set $scope.selected to membership', function(done) {
      this.userAPI.getCommunities = function() {
        return $q.reject({err: 'failed'});
      };
      this.scope.getMembership();
      this.scope.$digest();
      expect(this.scope.selected).to.equal('membership');
      done();
    });
  });
});
