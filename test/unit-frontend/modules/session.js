'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.session Angular module', function() {
  beforeEach(angular.mock.module('esn.session'));

  describe('session service', function() {
    beforeEach(function() {
      var self = this;
      inject(function(session) {
        self.session = session;
      });
    });

    it('should return an object with 3 properties: user, domain and token', function() {
      expect(this.session.user).to.be.an.object;
      expect(this.session.domain).to.be.an.object;
      expect(this.session.token).to.be.an.object;
    });

    it('should return an object with 3 methods: setUser, setDomain, setWebsocketToken', function() {
      expect(this.session).to.respondTo('setUser');
      expect(this.session).to.respondTo('setDomain');
      expect(this.session).to.respondTo('setWebsocketToken');
    });

    describe('setUser method', function() {
      it('should set the session.user object', function() {
        var user = this.session.user;
        var user1 = {
          _id: '1',
          name: 'hello'
        };
        var user2 = {
          _id: '2',
          name: 'yolo'
        };

        this.session.setUser(user1);
        expect(user).to.deep.equal(user1);
        this.session.setUser(user2);
        expect(user).to.deep.equal(user2);
      });
    });

    describe('setDomain method', function() {
      it('should set the session.domain object', function() {
        var domain = this.session.domain;
        var domain1 = {
          _id: '1',
          name: 'hello'
        };
        var domain2 = {
          _id: '2',
          name2: 'yolo'
        };

        this.session.setDomain(domain1);
        expect(domain).to.deep.equal(domain1);
        this.session.setDomain(domain2);
        expect(domain).to.deep.equal(domain2);
      });
    });

    describe('setWebsocketToken method', function() {
      it('should set the session.token object', function() {
        var token = this.session.token;
        var token1 = {
          _id: '1',
          name: 'hello'
        };
        var token2 = {
          _id: '2',
          name2: 'yolo'
        };

        this.session.setWebsocketToken(token1);
        expect(token).to.deep.equal(token1);
        this.session.setWebsocketToken(token2);
        expect(token).to.deep.equal(token2);
      });
    });

  });


  describe('sessionInitController', function() {
    beforeEach(inject(function($rootScope, $q, $controller, $route) {
      var userdefer = $q.defer();
      var domaindefer = $q.defer();
      var tokendefer = $q.defer();
      this.userdefer = userdefer;
      this.domaindefer = domaindefer;
      this.tokendefer = tokendefer;
      this.$scope = $rootScope.$new();
      this.$rootScope = $rootScope;
      this.$q = $q;

      this.userAPI = {
        currentUser: function() {
          return userdefer.promise;
        }
      };

      this.domainAPI = {
        get: function() {
          return domaindefer.promise;
        }
      };

      this.session = {
        setUser: function() {},
        setDomain: function() {}
      };

      this.tokenAPI = {
        getNewToken: function() {
          return tokendefer.promise;
        }
      };

      $controller('sessionInitController', {
        $scope: this.$scope,
        $q: this.$q,
        userAPI: this.userAPI,
        domainAPI: this.domainAPI,
        tokenAPI: this.tokenAPI,
        session: this.session
      });

    }));

    it('should populate a session.template property', function() {
      expect(this.$scope.session.template).to.equal('/views/esn/partials/loading.html');
    });

    it('should render the error template if there is an error in the user request', function() {
      this.userdefer.reject({data: {error: 'error', message: 'message'}});
      this.$scope.$digest();
      expect(this.$scope.session.template).to.equal('/views/esn/partials/loading-error.html');
      expect(this.$scope.session.error).to.deep.equal({error: 'error', message: 'message'});
    });

    it('should render the error template if the user does not belong to a domain', function() {
      this.userdefer.resolve({data: {_id: 'user1', name: 'foo'}});
      this.$scope.$digest();
      expect(this.$scope.session.template).to.equal('/views/esn/partials/loading-error.html');
      expect(this.$scope.session.error).to.deep.equal({error: 400, message: 'Invalid user', details: 'User does not belong to a domain', displayLogout: true});
    });

    it('should call domainAPI.get() with the first domain id in user.domains', function(done) {
      this.domainAPI.get = function(id) {
        expect(id).to.equal('I1');
        done();
      };
      this.userdefer.resolve({data: {_id: 'user1', name: 'foo', domains: [{domain_id: 'I1'}, {domain_id: 'I2'}]}});
      this.$scope.$digest();
    });


    it('should render the error template if there is an error in the domain request', function() {
      this.userdefer.resolve({data: {_id: 'user1', name: 'foo', domains: [{domain_id: 'I1'}, {domain_id: 'I2'}]}});
      this.$scope.$digest();
      this.domaindefer.reject({data: {error: 'error', message: 'message'}});
      this.$scope.$digest();
      expect(this.$scope.session.template).to.equal('/views/esn/partials/loading-error.html');
      expect(this.$scope.session.error).to.deep.equal({error: 'error', message: 'message'});
    });

    it('should render the application template if domain & user request succeded', function() {
      this.userdefer.resolve({data: {_id: 'user1', name: 'foo', domains: [{domain_id: 'I1'}, {domain_id: 'I2'}]}});
      this.$scope.$digest();
      this.domaindefer.resolve({data: {_id: 'D1', name: 'domain1'}});
      this.$scope.$digest();
      expect(this.$scope.session.template).to.equal('/views/esn/partials/application.html');
    });

    it('should call session.setUser when user is retrieved', function(done) {
      this.session.setUser = function(user) {
        expect(user).to.deep.equal({_id: 'user1', name: 'foo', domains: [{domain_id: 'I1'}, {domain_id: 'I2'}]});
        done();
      };
      this.userdefer.resolve({data: {_id: 'user1', name: 'foo', domains: [{domain_id: 'I1'}, {domain_id: 'I2'}]}});
      this.$scope.$digest();
    });

    it('should call session.setDomain when domain is retrieved', function(done) {
      this.session.setDomain = function(domain) {
        expect(domain).to.deep.equal({_id: 'D1', name: 'domain1'});
        done();
      };
      this.userdefer.resolve({data: {_id: 'user1', name: 'foo', domains: [{domain_id: 'I1'}, {domain_id: 'I2'}]}});
      this.$scope.$digest();
      this.domaindefer.resolve({data: {_id: 'D1', name: 'domain1'}});
      this.$scope.$digest();
    });

    it('should call session.setWebsocketToken when token is retrieved', function(done) {
      this.session.setWebsocketToken = function(token) {
        expect(token).to.deep.equal({_id: 1});
        done();
      };
      this.userdefer.resolve({data: {_id: 'user1', name: 'foo', domains: [{domain_id: 'I1'}, {domain_id: 'I2'}]}});
      this.$scope.$digest();
      this.tokendefer.resolve({data: {_id: 1}});
      this.$scope.$digest();
    });

  });

});
