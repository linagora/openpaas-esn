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

  describe('sessionFactory service', function() {
    var service, $q, $rootScope, userdefer, domaindefer, tokendefer, userAPI, domainAPI, session, tokenAPI;

    beforeEach(function() {

      userAPI = {
        currentUser: function() {
          userdefer = $q.defer();
          return userdefer.promise;
        }
      };

      domainAPI = {
        get: function() {
          domaindefer = $q.defer();
          return domaindefer.promise;
        }
      };

      session = {
        setUser: function() {},
        setDomain: function() {}
      };

      tokenAPI = {
        getNewToken: function() {
          tokendefer = $q.defer();
          return tokendefer.promise;
        }
      };

      module(function($provide) {
        $provide.value('userAPI', userAPI);
        $provide.value('domainAPI', domainAPI);
        $provide.value('tokenAPI', tokenAPI);
        $provide.value('session', session);
      });

      inject(function($injector, _$q_, _$rootScope_) {
        service = $injector.get('sessionFactory');
        $q = _$q_;
        $rootScope = _$rootScope_;
      });
    });

    it('should callback(error.data) if there is an error with error.data in the user request', function(done) {
      service.fetchUser(function(error) {
        if (error) {
          expect(error).to.deep.equal({error: 'error', message: 'message'});
          done();
        } else {
          done(new Error());
        }
      });
      userdefer.reject({data: {error: 'error', message: 'message'}});
      $rootScope.$digest();
    });

    it('should render the error template if the user does not belong to a domain', function(done) {
      service.fetchUser(function(error) {
        if (error) {
          expect(error).to.deep.equal({error: 400, message: 'Invalid user', details: 'User does not belong to a domain', displayLogout: true});
          done();
        } else {
          done(new Error());
        }
      });
      userdefer.resolve({data: {_id: 'user1', name: 'foo'}});
      $rootScope.$digest();
    });

    it('should call domainAPI.get() with the first domain id in user.domains', function(done) {
      domainAPI.get = function(id) {
        expect(id).to.equal('I1');
        done();
      };
      service.fetchUser(function() {});
      userdefer.resolve({data: {_id: 'user1', name: 'foo', domains: [{domain_id: 'I1'}, {domain_id: 'I2'}]}});
      $rootScope.$digest();
    });


    it('should render the error template if there is an error in the domain request', function(done) {
      service.fetchUser(function(error) {
        if (error) {
          expect(error).to.deep.equal({error: 'error', message: 'message'});
          done();
        } else {
          done(new Error());
        }
      });

      userdefer.resolve({data: {_id: 'user1', name: 'foo', domains: [{domain_id: 'I1'}, {domain_id: 'I2'}]}});
      $rootScope.$digest();
      domaindefer.reject({data: {error: 'error', message: 'message'}});
      $rootScope.$digest();
    });

    it('should render the application template if domain & user request succeded', function(done) {
      service.fetchUser(function(error) {
        if (error) {
          done(new Error());
        } else {
          done();
        }
      });

      userdefer.resolve({data: {_id: 'user1', name: 'foo', domains: [{domain_id: 'I1'}, {domain_id: 'I2'}]}});
      $rootScope.$digest();
      domaindefer.resolve({data: {_id: 'D1', name: 'domain1'}});
      $rootScope.$digest();
    });

    it('should call session.setUser when user is retrieved', function(done) {
      session.setUser = function(user) {
        expect(user).to.deep.equal({_id: 'user1', name: 'foo', domains: [{domain_id: 'I1'}, {domain_id: 'I2'}]});
        done();
      };
      service.fetchUser(function(error) {
        if (error) {
          done(new Error());
        } else {
          done();
        }
      });
      service.fetchUser(function() {});

      userdefer.resolve({data: {_id: 'user1', name: 'foo', domains: [{domain_id: 'I1'}, {domain_id: 'I2'}]}});
      $rootScope.$digest();
    });

    it('should call session.setDomain when domain is retrieved', function(done) {
      session.setDomain = function(domain) {
        expect(domain).to.deep.equal({_id: 'D1', name: 'domain1'});
        done();
      };
      service.fetchUser(function() {});

      userdefer.resolve({data: {_id: 'user1', name: 'foo', domains: [{domain_id: 'I1'}, {domain_id: 'I2'}]}});
      $rootScope.$digest();
      domaindefer.resolve({data: {_id: 'D1', name: 'domain1'}});
      $rootScope.$digest();
    });

    it('should call session.setWebsocketToken when token is retrieved', function(done) {
      session.setWebsocketToken = function(token) {
        expect(token).to.deep.equal({_id: 1});
        done();
      };
      service.fetchUser(function() {});

      userdefer.resolve({data: {_id: 'user1', name: 'foo', domains: [{domain_id: 'I1'}, {domain_id: 'I2'}]}});
      $rootScope.$digest();
      domaindefer.resolve({data: {_id: 'D1', name: 'domain1'}});
      $rootScope.$digest();
      tokendefer.resolve({data: {_id: 1}});
      $rootScope.$digest();
    });

  });

});
