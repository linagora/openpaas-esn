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
      expect(this.ContactAttendeeProvider.objectType).to.be.defined;
    });
  });
});
