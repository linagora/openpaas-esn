'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The contactSearchProviderService service', function() {
  var user, session, ContactAPIClient, contactSearchProviderService, $rootScope, searchMock, contacts, esnSearchProvider;

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

    esnSearchProvider = function(options) {
      this.options = options;
    };

  });

  beforeEach(function() {
    module('linagora.esn.contact', function($provide) {
      $provide.value('ContactAPIClient', ContactAPIClient);
      $provide.value('esnSearchProvider', esnSearchProvider);
      $provide.value('session', session);
    });
  });

  beforeEach(angular.mock.inject(function(_contactSearchProviderService_, _$rootScope_) {
    contactSearchProviderService = _contactSearchProviderService_;
    $rootScope = _$rootScope_;
  }));

  describe('The contactSearchProviderService factory', function() {

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

      var fetcher = contactSearchProviderService.options.fetch('abcd');

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

        var fetcher = contactSearchProviderService.options.fetch('abcd');

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

        var fetcher = contactSearchProviderService.options.fetch('abcd');

        fetcher().then(check, done);

        $rootScope.$digest();
      });
    });
  });
});
