'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Contacts Angular Attendee Provider module', function() {

  var user, session, ContactAPIClient, ContactsHelper, searchMock;

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

    ContactsHelper = {
      orderData: function() {}
    };
  });

  describe('The ContactAttendeeProvider service', function() {

    beforeEach(function() {
      module('linagora.esn.contact', function($provide) {
        $provide.value('ContactAPIClient', ContactAPIClient);
        $provide.value('ContactsHelper', ContactsHelper);
        $provide.value('session', session);
      });
    });

    beforeEach(angular.mock.inject(function(ContactAttendeeProvider, $rootScope) {
      this.$rootScope = $rootScope;
      this.ContactAttendeeProvider = ContactAttendeeProvider;
    }));

    it('should return an attendeeService compliant object', function() {
      expect(this.ContactAttendeeProvider.templateUrl).to.be.defined;
      expect(this.ContactAttendeeProvider.searchAttendee).to.be.a.function;
    });

    describe('The searchAttendee function', function() {

      function setMockResult(data) {
        searchMock = function() {
          return $q.when(data);
        };
      }

      it('should set the first email as default when contact have multiple emails', function(done) {
        var mail = 'me@work.com';
        setMockResult({
          data: [
            {
              id: 1,
              emails: [{type: 'Work', value: mail}, {type: 'Home', value: 'me@home.com'}]
            }
          ]
        });

        this.ContactAttendeeProvider.searchAttendee().then(function(response) {
          expect(response[0].email).to.equal(mail);
          done();
        }, done);
        this.$rootScope.$digest();
      });

      it('should set the default mail as undefined when contact emails array is empty', function(done) {
        setMockResult({
          data: [
            {
              id: 1,
              emails: []
            }
          ]
        });

        this.ContactAttendeeProvider.searchAttendee().then(function(response) {
          expect(response[0].email).to.not.be.defined;
          done();
        }, done);
        this.$rootScope.$digest();
      });

      it('should set the default mail as undefined when contact emails array is undefined', function(done) {
        setMockResult({
          data: [
            {
              id: 1
            }
          ]
        });

        this.ContactAttendeeProvider.searchAttendee().then(function(response) {
          expect(response[0].email).to.not.be.defined;
          done();
        }, done);
        this.$rootScope.$digest();
      });

      it('should send back empty result when Contact search fails', function(done) {
        searchMock = function() {
          return $q.reject(new Error());
        };

        this.ContactAttendeeProvider.searchAttendee().then(function(response) {
          expect(response).to.deep.equal([]);
          done();
        }, done);
        this.$rootScope.$digest();
      });
    });
  });
});
