'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The searchContactProviderService service', function() {
  var user, session, ContactAPIClient, searchContactProviderService, $rootScope, searchMock, contacts;

  beforeEach(function() {
    user = {
      _id: 123
    };

    session = {
      user: user,
      ready: {
        then: function() {}
      }
    };

    ContactAPIClient = {
      addressbookHome: function() {
        return {
          search: searchMock
        };
      }
    };

    contacts = [
      {_id: 1, firstname: 'Nicolas', lastname: 'Cage'},
      {_id: 2, firstname: 'Bruce', lastname: 'Willis'}
    ];

  });

  beforeEach(function() {
    module('linagora.esn.contact', function($provide) {
      $provide.value('ContactAPIClient', ContactAPIClient);
      $provide.value('session', session);
    });
  });

  beforeEach(angular.mock.inject(function(_searchContactProviderService_, _$rootScope_) {
    searchContactProviderService = _searchContactProviderService_;
    $rootScope = _$rootScope_;
  }));

  describe('The searchContactProviderService factory', function() {

    function setMockResult(data) {
      searchMock = function() {
        return $q.when(data);
      };
    }

    it('should search contacts from domain and adapt the result', function(done) {

      setMockResult({
        data: contacts
      });

      function check(result) {
        expect(result.length).to.equal(2);

        contacts.forEach(function(contact) {
          expect(contact).to.have.ownProperty('type');
        });

        done();
      }

      var fetcher = searchContactProviderService.fetch('abcd');

      fetcher().then(check, done);

      $rootScope.$digest();
    });

    describe('The date property of contacts', function() {
      var fakeTimestamp, clock;

      beforeEach(function() {
        fakeTimestamp = 1519900268;
        clock = sinon.useFakeTimers(fakeTimestamp);
      });

      afterEach(function() {
        clock.restore();
      });

      it('should set contact.date when contacts have no date property', function(done) {
        setMockResult({
          data: contacts
        });

        function check(results) {
          results.forEach(function(contact) {
            expect(contact).to.have.property('date');
            expect(contact.date.getTime()).to.equal(fakeTimestamp);
          });

          done();
        }

        var fetcher = searchContactProviderService.fetch('abcd');

        fetcher().then(check, done);

        $rootScope.$digest();
      });

      it('should override existing contact.date with current date', function(done) {
        var contacts = [
          {_id: 1, firstname: 'Nicolas', lastname: 'Cage', date: 'Mon Feb 10 2016 15:16:41 GMT+0100 (CET)'},
          {_id: 2, firstname: 'Bruce', lastname: 'Willis', date: 'Mon Feb 10 2016 15:16:41 GMT+0100 (CET)'}
        ];

        setMockResult({
          data: contacts
        });

        function check(results) {

          results.forEach(function(contact) {
            expect(contact).to.have.property('date');
            expect(contact.date.getTime()).to.equal(fakeTimestamp);
          });

          done();
        }

        var fetcher = searchContactProviderService.fetch('abcd');

        fetcher().then(check, done);

        $rootScope.$digest();
      });
    });
  });
});
