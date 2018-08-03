'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The User Angular module', function() {
  beforeEach(angular.mock.module('esn.user'));

  describe('userAPI service', function() {

    beforeEach(angular.mock.inject(function(userAPI, $httpBackend) {
      this.$httpBackend = $httpBackend;
      this.userAPI = userAPI;
    }));

    describe('user(:uuid) method', function() {

      it('should send a request to /api/users/:uuid', function() {
        var uuid = 123456789;
        this.$httpBackend.expectGET('/api/users/' + uuid).respond(this.response);
        this.userAPI.user(uuid);
        this.$httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = this.userAPI.user(123456789);

        expect(promise.then).to.be.a.function;
      });
    });

    describe('currentUser() method', function() {

      it('should send a request to /api/user', function() {
        this.$httpBackend.expectGET(/\/api\/user\?_=[0-9]+$/).respond(this.response);
        this.userAPI.currentUser();
        this.$httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = this.userAPI.currentUser();

        expect(promise.then).to.be.a.function;
      });
    });

    describe('The setUserStates method', function() {

      it('should send a request to /api/users', function() {
        var domainId = 456;
        var userId = 123;
        var states = [{ name: 'login', value: 'disabled' }];

        this.$httpBackend.expectPUT('/api/users/' + userId + '/states?domain_id=' + domainId, states).respond(this.response);
        this.userAPI.setUserStates(userId, states, domainId);
        this.$httpBackend.flush();
      });
    });

    describe('getCommunities() method', function() {

      beforeEach(angular.mock.inject(function(userAPI, $httpBackend, Restangular) {
        this.$httpBackend = $httpBackend;
        this.userAPI = userAPI;
        Restangular.setFullResponse(true);
      }));

      it('should send a GET request to /api/user/communities', function() {
        this.$httpBackend.expectGET('/api/user/communities').respond(200, []);
        this.userAPI.getCommunities();
        this.$httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = this.userAPI.getCommunities();

        expect(promise.then).to.be.a.function;
      });
    });

    describe('getUsersByEmail() method', function() {

      it('should send a GET request to /api/users', function() {
        this.$httpBackend.expectGET('/api/users?email=admin@open-paas.org').respond(200, []);
        this.userAPI.getUsersByEmail('admin@open-paas.org');
        this.$httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = this.userAPI.getUsersByEmail();

        expect(promise.then).to.be.a.function;
      });
    });
  });

  describe('userUtils service', function() {
    beforeEach(angular.mock.inject(function(userUtils) {
      this.userUtils = userUtils;
    }));

    describe('displayNameOf() method', function() {
      it('should return prerferredEmail if both firstname and lastname do not exist', function() {
        var user = { preferredEmail: 'email' };

        expect(this.userUtils.displayNameOf(user)).to.equal(user.preferredEmail);
      });

      it('should return firstname if lastname does not exist', function() {
        var user = { firstname: 'f', preferredEmail: 'email' };

        expect(this.userUtils.displayNameOf(user)).to.equal('f');
      });

      it('should return lastname if firstname does not exist', function() {
        var user = { lastname: 'l', preferredEmail: 'email' };

        expect(this.userUtils.displayNameOf(user)).to.equal('l');
      });

      it('should return firstname lastname if both exist', function() {
        var user = { firstname: 'f', lastname: 'l', preferredEmail: 'email' };

        expect(this.userUtils.displayNameOf(user)).to.equal('f l');
      });
    });
  });

  describe('directive usersAutocompleteInput', function() {
    var asSession, domainAPIMock, autoCompleteMax;
    var query = 'aQuery';

    beforeEach(function() {
      asSession = {
        user: {
          _id: '123456',
          emails: ['user1@test.com'],
          emailMap: { 'user1@test.com': true }
        },
        domain: {
          company_name: 'test',
          _id: 'domainId'
        },
        ready: $q.when()
      };

      var user1 = {_id: 'user1', firstname: 'first1', lastname: 'last1', preferredEmail: 'user1@open-paas.org'},
          user3 = {_id: 'user3', firstname: 'first3', lastname: 'last3', preferredEmail: 'user3@open-paas.org'},
          user2 = {_id: 'user2', firstname: 'first2', lastname: 'last2', preferredEmail: 'user2@open-paas.org'};

      domainAPIMock = {
        getMembers: function() {
          return $q.when({data: [user1, user2, user3]});
        }
      };

      autoCompleteMax = 6;

      module('jadeTemplates');
      angular.mock.module(function($provide) {
        $provide.value('session', asSession);
        $provide.value('domainAPI', domainAPIMock);
        $provide.constant('AUTOCOMPLETE_MAX_RESULTS', autoCompleteMax);
      });
    });
    beforeEach(angular.mock.module('naturalSort'));
    beforeEach(angular.mock.inject(function($rootScope, $compile, USER_AUTO_COMPLETE_TEMPLATE_URL, naturalService) {
      this.$rootScope = $rootScope;
      this.$scope = this.$rootScope.$new();
      this.$compile = $compile;
      this.naturalService = naturalService;
      this.USER_AUTO_COMPLETE_TEMPLATE_URL = USER_AUTO_COMPLETE_TEMPLATE_URL;

      this.initDirective = function(scope) {
        var html = '<users-autocomplete-input original-users="users" mutable-users="newUsers"/>';
        scope.newUsers = [];
        var element = this.$compile(html)(scope);
        scope.$digest();
        this.eleScope = element.isolateScope();
        return element;
      };
    }));

    describe('getUsers function', function() {
      it('should call domainAPI.getMembers function and return a array is sorted.', function() {
        this.initDirective(this.$scope);
        var expectResult = [{_id: 'user1', firstname: 'first1', lastname: 'last1', preferredEmail: 'user1@open-paas.org', displayName: 'first1 last1', templateUrl: this.USER_AUTO_COMPLETE_TEMPLATE_URL},
                            {_id: 'user2', firstname: 'first2', lastname: 'last2', preferredEmail: 'user2@open-paas.org', displayName: 'first2 last2', templateUrl: this.USER_AUTO_COMPLETE_TEMPLATE_URL},
                            {_id: 'user3', firstname: 'first3', lastname: 'last3', preferredEmail: 'user3@open-paas.org', displayName: 'first3 last3', templateUrl: this.USER_AUTO_COMPLETE_TEMPLATE_URL}];
        var thenSpy = sinon.spy();
        this.eleScope.getUsers(query).then(thenSpy);
        this.$scope.$digest();

        expect(thenSpy).to.have.been.calledWith(expectResult);
      });

      it('should remove connected user from result based on email comparing to added users', function() {
        this.initDirective(this.$scope);
        asSession.user = {
            emails: ['user1@test.com'],
            emailMap: { 'user1@open-paas.org': true }
          };

        var expectResult = [{_id: 'user2', firstname: 'first2', lastname: 'last2', preferredEmail: 'user2@open-paas.org', displayName: 'first2 last2', templateUrl: this.USER_AUTO_COMPLETE_TEMPLATE_URL},
          {_id: 'user3', firstname: 'first3', lastname: 'last3', preferredEmail: 'user3@open-paas.org', displayName: 'first3 last3', templateUrl: this.USER_AUTO_COMPLETE_TEMPLATE_URL}];
        var thenSpy = sinon.spy();
        this.eleScope.getUsers(query).then(thenSpy);
        this.$scope.$digest();

        expect(thenSpy).to.have.been.calledWith(expectResult);
      });

      it('should remove duplicate users based on ID comparing to added users', function() {
        this.initDirective(this.$scope);
        this.eleScope.originalUsers = [{
          _id: 'user1',
          preferredEmail: 'user1@open-paas.org'
        }];
        this.eleScope.mutableUsers = [{
          _id: 'user2',
          preferredEmail: 'user2@open-paas.org'
        }];

        var expectResult = [{_id: 'user3', firstname: 'first3', lastname: 'last3', preferredEmail: 'user3@open-paas.org', displayName: 'first3 last3', templateUrl: this.USER_AUTO_COMPLETE_TEMPLATE_URL}];
        var thenSpy = sinon.spy();
        this.eleScope.getUsers(query).then(thenSpy);
        this.$scope.$digest();

        expect(thenSpy).to.have.been.calledWith(expectResult);
      });

      it('should remove ignored users based on ID', function() {
        this.initDirective(this.$scope);
        this.eleScope.ignoredUsers = [{
          _id: 'user1',
          preferredEmail: 'user1@open-paas.org'
        }];

        var expectResult = [{_id: 'user2', firstname: 'first2', lastname: 'last2', preferredEmail: 'user2@open-paas.org', displayName: 'first2 last2', templateUrl: this.USER_AUTO_COMPLETE_TEMPLATE_URL},
                            {_id: 'user3', firstname: 'first3', lastname: 'last3', preferredEmail: 'user3@open-paas.org', displayName: 'first3 last3', templateUrl: this.USER_AUTO_COMPLETE_TEMPLATE_URL}];
        var thenSpy = sinon.spy();
        this.eleScope.getUsers(query).then(thenSpy);
        this.$scope.$digest();

        expect(thenSpy).to.have.been.calledWith(expectResult);
      });

      it('should return an empty array if domainAPI.getMembers return an error', function() {
        domainAPIMock.getMembers = function() {
          return $q.reject(new Error('function domainAPIMock.getMembers return error'));
        };

        this.initDirective(this.$scope);

        var thenSpy = sinon.spy();
        this.eleScope.getUsers(query).then(thenSpy);
        this.$scope.$digest();

        expect(thenSpy).to.have.been.calledWith([]);
      });
    });
  });
});
