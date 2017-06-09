'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The Domain Angular module', function() {
  beforeEach(angular.mock.module('esn.domain'));

  describe('The domainAPI service', function() {

    var domainAPI, $httpBackend;
    var DOMAIN_ID = '123456789';

    beforeEach(inject(function(_$httpBackend_, _domainAPI_) {
      $httpBackend = _$httpBackend_;
      domainAPI = _domainAPI_;
    }));

    describe('The list function', function() {
      var domains;

      beforeEach(function() {
        domains = [{name: 'MyDomain', company_name: 'MyAwesomeCompany'}];
      });

      it('should send a GET to /api/domains', function(done) {
        $httpBackend.expectGET('/api/domains').respond(200, domains);
        domainAPI.list().then(function(response) {
          expect(response.data).to.shallowDeepEqual(domains);

          done();
        });
        $httpBackend.flush();
      });
    });

    describe('The inviteUsers fn', function() {

      it('should send a POST to /api/domains/:uuid/invitations', function() {
        var users = ['foo@bar.com', 'baz@bar.com', 'qux@bar.com', 'yolo@bar.com'];

        $httpBackend.expectPOST('/api/domains/' + DOMAIN_ID + '/invitations', users).respond(202);
        domainAPI.inviteUsers(DOMAIN_ID, users);
        $httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = domainAPI.inviteUsers(DOMAIN_ID, {});

        expect(promise.then).to.be.a.function;
      });
    });

    describe('The getMembers fn', function() {

      var response, headers;

      beforeEach(function() {
        response = [{name: 'MyDomain', company_name: 'MyAwesomeCompany'}];
        headers = {'x-esn-items-count': response.length};
      });

      it('should send a request to /api/domains/:uuid', function() {
        $httpBackend.expectGET('/api/domains/' + DOMAIN_ID + '/members').respond(200, response, headers);
        domainAPI.getMembers(DOMAIN_ID);
        $httpBackend.flush();
      });

      it('should send a request to /api/domains/:uuid/members?limit=10&offset=20', function() {
        var query = {limit: 10, offset: 20};

        $httpBackend.expectGET('/api/domains/' + DOMAIN_ID + '/members?limit=' + query.limit + '&offset=20').respond(200, response, headers);
        domainAPI.getMembers(DOMAIN_ID, query);
        $httpBackend.flush();
      });

      it('should send a request to /api/domains/:uuid?search=foo+bar', function() {
        var query = {search: 'foo bar'};

        $httpBackend.expectGET('/api/domains/' + DOMAIN_ID + '/members?search=foo+bar').respond(200, response, headers);
        domainAPI.getMembers(DOMAIN_ID, query);
        $httpBackend.flush();
      });

      it('should be able to get the count header from the response', function(done) {
        $httpBackend.expectGET('/api/domains/' + DOMAIN_ID + '/members').respond(200, response, headers);

        domainAPI.getMembers(DOMAIN_ID, {}).then(
          function(data) {
            expect(data).to.be.not.null;
            expect(data.headers).to.be.a.function;
            expect(data.headers('x-esn-items-count')).to.be.not.null;
            expect(data.headers('x-esn-items-count')).to.equal('' + headers['x-esn-items-count']);
            done();
          },
          function(err) {
            done(err);
          });
        $httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = domainAPI.getMembers(DOMAIN_ID, {});

        expect(promise.then).to.be.a.function;
      });
    });

    describe('The isManager fn', function() {

      var response;

      beforeEach(function() {
        response = {name: 'MyDomain', company_name: 'MyAwesomeCompany'};
      });

      it('should send a request to /api/domains/:uuid/manager', function() {
        $httpBackend.expectGET('/api/domains/' + DOMAIN_ID + '/manager').respond(200, response);
        domainAPI.isManager(DOMAIN_ID);
        $httpBackend.flush();
      });
    });

    describe('The get fn', function() {

      var response;

      beforeEach(function() {
        response = {name: 'MyDomain', company_name: 'MyAwesomeCompany'};
      });

      it('should send a request to /api/domains/:uuid', function() {
        $httpBackend.expectGET('/api/domains/' + DOMAIN_ID).respond(200, response);
        domainAPI.get(DOMAIN_ID);
        $httpBackend.flush();
      });
    });

    describe('The createMember fn', function() {
      var domainId, newUser;

      beforeEach(function() {
        domainId = '123456789';
        newUser = {
          password: 'secret',
          firstname: 'new',
          lastname: 'member',
          accounts: [{
            type: 'email',
            hosted: true,
            preferredEmailIndex: 0,
            emails: ['newMember@lng.net']
          }]
        };
      });

      it('shoud send a POST to /api/domains/:uuid/members', function(done) {
        $httpBackend.expectPOST('/api/domains/' + domainId + '/members').respond(201, newUser);
        domainAPI.createMember(domainId, newUser)
          .then(function(response) {
            expect(response.data.lastname).to.be.equal(newUser.lastname);

            done();
          });

        $httpBackend.flush();
      });
    });

    describe('The addAdministrators fn', function() {

      it('should send POST request to backend with the right parameters', function(done) {
        var userIds = ['u1', 'u2'];
        var domainId = 'domain123';

        $httpBackend.expectPOST('/api/domains/' + domainId + '/administrators', userIds).respond(204);
        domainAPI.addAdministrators(domainId, userIds)
          .then(function(response) {
            expect(response.data).to.not.be.defined;
            done();
          });

        $httpBackend.flush();
      });

    });

    describe('The getAdministrators fn', function() {
      it('should send GET request to /api/domains/:uuid/administrators', function(done) {
        var domainId = 'domain123';
        var administrators = ['Admin1', 'Admin2'];

        $httpBackend.expectGET('/api/domains/' + domainId + '/administrators').respond(200, administrators);
        domainAPI.getAdministrators(domainId)
          .then(function(response) {
            expect(response.data.length).to.be.equal(administrators.length);
            expect(response.data[0]).to.be.equal(administrators[0]);
            expect(response.data[1]).to.be.equal(administrators[1]);
            done();
          });

        $httpBackend.flush();
      });
    });

    describe('The removeAdministrator fn', function() {

      it('should send DELETE request to backend with the right parameters', function(done) {
        var administratorId = 'adminId';
        var domainId = 'domain123';

        $httpBackend.expectDELETE('/api/domains/' + domainId + '/administrators/' + administratorId).respond(204);
        domainAPI.removeAdministrator(domainId, administratorId)
          .then(function(response) {
            expect(response.data).to.not.be.defined;
            done();
          });

        $httpBackend.flush();
      });

    });
  });

  describe('The domainSearchMembersProvider service', function() {
    var domainSearchMembersProvider;
    var $rootScope, domainAPI;

    beforeEach(inject(function(_$rootScope_, _domainSearchMembersProvider_, _domainAPI_) {
      $rootScope = _$rootScope_;
      domainSearchMembersProvider = _domainSearchMembersProvider_;
      domainAPI = _domainAPI_;
    }));

    describe('The get fn', function() {
      it('should return searchMembersProvider', function(done) {
        var domainId = '123456';
        var query = 'abc';
        var limit = 20;

        var memberQuery = {search: query, limit: limit};
        var searchMembersProvider = domainSearchMembersProvider.get(domainId);

        domainAPI.getMembers = sinon.stub().returns($q.when({data: []}));

        searchMembersProvider.searchAttendee(query, limit).then(function() {
          expect(domainAPI.getMembers).to.have.been.calledWith(domainId, memberQuery);
          done();
        });

        $rootScope.$digest();
      });
    });
  });

  describe('inviteMembersInput directive', function() {

    describe('submit button', function() {

      var scope, $compile, html, domainAPI;

      beforeEach(module('jadeTemplates'));

      beforeEach(angular.mock.inject(function($rootScope, _$compile_, _domainAPI_) {
        scope = $rootScope.$new();
        scope.domain = {_id: 123456789};
        $compile = _$compile_;
        domainAPI = _domainAPI_;
        html = '<invite-members-input domain="domain"/>';
      }));

      it('should call the domainAPI inviteMember when invite is called', function(done) {
        var element = $compile(html)(scope);

        scope.$digest();

        var iscope = element.isolateScope();

        iscope.emails = [{email: 'foo@baz.com'}, {email: 'bar@baz.com'}];
        domainAPI.inviteUsers = function() {
          done();
        };
        iscope.invite();
      });

      it('should call the domainAPI inviteMember with domain id and array of emails', function(done) {
        var inputEmails = [{email: 'foo@baz.com'}, {email: 'bar@baz.com'}];

        domainAPI.inviteUsers = function(id, emails) {
          expect(id).exist;
          expect(emails).exist;
          expect(id).is.equal(scope.domain._id);
          expect(emails.length).is.equal(2);
          expect(emails[0]).is.equal(inputEmails[0].email);
          expect(emails[1]).is.equal(inputEmails[1].email);
          done();
        };

        var element = $compile(html)(scope);

        scope.$digest();

        var iscope = element.isolateScope();

        iscope.emails = inputEmails;
        iscope.invite();
      });
    });
  });
});
