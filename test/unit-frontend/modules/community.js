'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Community Angular module', function() {
  beforeEach(angular.mock.module('esn.community'));

  describe('communityAPI service', function() {

    describe('list() function', function() {
      beforeEach(angular.mock.inject(function(communityAPI, $httpBackend, Restangular) {
        this.communityAPI = communityAPI;
        this.$httpBackend = $httpBackend;
        this.domainId = '123456789';
        Restangular.setFullResponse(true);
      }));

      it('should send a GET to /communities?domain_id=:id', function() {
        this.$httpBackend.expectGET('/communities?domain_id=' + this.domainId).respond(200, []);
        this.communityAPI.list(this.domainId);
        this.$httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = this.communityAPI.list();
        expect(promise.then).to.be.a.function;
      });
    });

    describe('get() function', function() {

      beforeEach(angular.mock.inject(function(communityAPI, $httpBackend, Restangular) {
        this.communityAPI = communityAPI;
        this.$httpBackend = $httpBackend;
        this.domainId = '123456789';
        this.communityId = '123';
        this.response = {_id: 123, title: 'Node.js'};
        Restangular.setFullResponse(true);
      }));

      it('should send a GET request to /communities/:uuid', function() {
        this.$httpBackend.expectGET('/communities/' + this.communityId).respond(200, this.response, this.headers);
        this.communityAPI.get(this.communityId);
        this.$httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = this.communityAPI.get(this.communityId);
        expect(promise.then).to.be.a.function;
      });
    });

    describe('del() function', function() {

      beforeEach(angular.mock.inject(function(communityAPI, $httpBackend, Restangular) {
        this.communityAPI = communityAPI;
        this.$httpBackend = $httpBackend;
        this.domainId = '123456789';
        this.communityId = '123';
        Restangular.setFullResponse(true);
      }));

      it('should send a DEL request to /communities/:uuid', function() {
        this.$httpBackend.expectDELETE('/communities/' + this.communityId).respond(204);
        this.communityAPI.del(this.communityId);
        this.$httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = this.communityAPI.del(this.communityId);
        expect(promise.then).to.be.a.function;
      });
    });

    describe('create() function', function() {

      beforeEach(angular.mock.inject(function(communityAPI, $httpBackend, Restangular) {
        this.communityAPI = communityAPI;
        this.$httpBackend = $httpBackend;
        this.domainId = '123456789';
        this.communityId = '123';
        Restangular.setFullResponse(true);
      }));

      it('should send a POST request to /communities', function() {
        var community = {};
        this.$httpBackend.expectPOST('/communities', community).respond(202);
        this.communityAPI.create(community);
        this.$httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = this.communityAPI.create({});
        expect(promise.then).to.be.a.function;
      });
    });
  });

  describe('communityCreateController controller', function() {
    beforeEach(inject(function($rootScope, $controller, $q) {
      this.communityAPI = {};
      this.location = {};
      this.log = {
        error: function() {
        }
      };
      this.alert = function() {};
      this.session = {domain: {_id: 123}};
      this.scope = $rootScope.$new();
      this.$q = $q;

      $controller('communityCreateController', {
        $scope: this.scope,
        $location: this.location,
        $log: this.log,
        $alert: this.alert,
        session: this.session,
        communityAPI: this.communityAPI
      });
    }));

    it('should call the communityAPI#create function when $scope.create is called', function(done) {
      this.communityAPI.create = function() {
        done();
      };
      this.scope.create({title: 'Node.js', domain_ids: ['1234']});
    });

    it('should not call the communityAPI#create function when $scope.create is called without community title', function(done) {
      this.scope.displayError = function() {
        return done();
      };
      this.communityAPI.create = function() {
        done(new Error());
      };
      this.scope.create({domain_ids: ['1234']});
    });

    it('should not call the communityAPI#create function when $scope.create is called without domain_ids', function(done) {
      this.scope.displayError = function() {
        return done();
      };
      this.communityAPI.create = function() {
        done(new Error());
      };
      this.scope.create({title: 'Node.js'});
    });

    it('should not call the communityAPI#create function when $scope.create is called with empty domain_ids', function(done) {
      this.scope.displayError = function() {
        return done();
      };
      this.communityAPI.create = function() {
        done(new Error());
      };
      this.scope.create({title: 'Node.js', domain_ids: []});
    });

    it('should change $location.path when call to the communityAPI#create is successful', function(done) {
      this.location.path = function(path) {
        expect(path).to.equal('/communities/123');
        return done();
      };
      var communityDefer = this.$q.defer();
      this.communityAPI.create = function() {
        return communityDefer.promise;
      };
      communityDefer.resolve({data: {_id: 123, title: 'Node.js'}});
      this.scope.create({title: 'Node.js', domain_ids: ['123']});
      this.scope.$digest();
    });

    it('should display error when call to the communityAPI#create is not successful', function(done) {
      this.scope.displayError = function() {
        return done();
      };
      this.location.path = function(path) {
        return done(new Error());
      };
      var communityDefer = this.$q.defer();
      this.communityAPI.create = function() {
        return communityDefer.promise;
      };
      communityDefer.reject({error: 500});
      this.scope.create({title: 'Node.js', domain_ids: ['123']});
      this.scope.$digest();
    });
  });

  describe('communitiesController controller', function() {
    beforeEach(inject(function($rootScope, $controller, $q) {
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
      this.session = {domain: {_id: 123}};
      this.scope = $rootScope.$new();
      this.$q = $q;
      this.log = {
        error: function() {
        }
      };

      $controller('communitiesController', {
        $scope: this.scope,
        $log: this.log,
        session: this.session,
        communityAPI: this.communityAPI
      });
    }));

    it('getAll fn should call communityAPI#list', function(done) {
      this.communityAPI.list = function() {
        return done();
      };
      this.scope.getAll();
    });

    it('getAll fn should set the $scope.communities with communityAPI#list result', function(done) {
      var result = [{_id: 123}, {_id: 234}];
      var communityDefer = this.$q.defer();
      this.communityAPI.list = function() {
        return communityDefer.promise;
      };
      communityDefer.resolve({data: result});
      this.scope.getAll();
      this.scope.$digest();
      expect(this.scope.communities).to.deep.equal(result);
      done();
    });

    it('getAll fn should set $scope.error to true when communityAPI#list fails', function(done) {
      var communityDefer = this.$q.defer();
      this.communityAPI.list = function() {
        return communityDefer.promise;
      };
      communityDefer.reject({err: 'failed'});
      this.scope.getAll();
      this.scope.$digest();
      expect(this.scope.error).to.be.true;
      done();
    });

    it('getAll fn should set $scope.selected to all', function(done) {
      var communityDefer = this.$q.defer();
      this.communityAPI.list = function() {
        return communityDefer.promise;
      };
      communityDefer.reject({err: 'failed'});
      this.scope.getAll();
      this.scope.$digest();
      expect(this.scope.selected).to.equal('all');
      done();
    });
  });
});
