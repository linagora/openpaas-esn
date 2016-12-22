'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The LDAP Angular module', function() {
  beforeEach(angular.mock.module('esn.ldap'));

  describe('The ldapAPI service', function() {
    var ldapAPI, $httpBackend;
    var response, headers;

    beforeEach(function() {
      response = [{firstname: 'firstname', lastname: 'lastname'}];
      headers = {'x-esn-items-count': response.length};
    });

    beforeEach(inject(function(_$httpBackend_, _ldapAPI_) {
      $httpBackend = _$httpBackend_;
      ldapAPI = _ldapAPI_;
    }));

    describe('The searchUsers fn', function() {
      it('should send a GET to /api/ldap/search?limit=20&search=a', function() {
        var query = {search: 'a', limit: 20};

        $httpBackend.expectGET('/api/ldap/search?limit=20&search=a').respond(200, response, headers);
        ldapAPI.searchUsers(query);
        $httpBackend.flush();
      });

      it('should be able to get the count header from the response', function(done) {
        var query = {search: 'a', limit: 20};

        $httpBackend.expectGET('/api/ldap/search?limit=20&search=a').respond(200, response, headers);

        ldapAPI.searchUsers(query).then(
          function(data) {
            expect(data).to.be.not.null;
            expect(data.headers).to.be.a.function;
            expect(data.headers('x-esn-items-count')).to.equal('' + headers['x-esn-items-count']);
            done();
          },
          function(err) {
            done(err);
          });
        $httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = ldapAPI.searchUsers({});

        expect(promise.then).to.be.a.function;
      });
    });
  });

  describe('The ldapSearchProvider service', function() {
    var ldapSearchProvider;
    var $rootScope, ldapAPI;

    beforeEach(inject(function(_$rootScope_, _ldapSearchProvider_, _ldapAPI_) {
      $rootScope = _$rootScope_;
      ldapSearchProvider = _ldapSearchProvider_;
      ldapAPI = _ldapAPI_;
    }));

    describe('The searchAttendee fn', function() {
      it('should call ldapAPI.searchUsers to get ldap\'s user', function(done) {
        var search = 'abc';
        var limit = 20;

        var userQuery = {search: search, limit: limit};

        ldapAPI.searchUsers = sinon.stub().returns($q.when({data: []}));

        ldapSearchProvider.searchAttendee(search, limit).then(function(users) {
          expect(users).to.deep.equal([]);
          expect(ldapAPI.searchUsers).to.have.been.calledWith(userQuery);
          done();
        });

        $rootScope.$digest();
      });
    });
  });
});
