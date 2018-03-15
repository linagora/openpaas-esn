'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The contactService service', function() {
  var $rootScope, $q;
  var session, contactService, ContactAPIClient, createFn;

  beforeEach(function() {
    module('esn.session', function($provide) {
      session = {
        user: {
          _id: '123'
        },
        ready: {
          then: angular.noop
        }
      };

      $provide.value('session', session);
    });
    module('linagora.esn.contact');

    inject(function(
      _$rootScope_,
      _$q_,
      _contactService_,
      _ContactAPIClient_
    ) {
      $rootScope = _$rootScope_;
      $q = _$q_;
      ContactAPIClient = _ContactAPIClient_;
      contactService = _contactService_;
    });
  });

  describe('The copyContact function', function() {

    beforeEach(function() {
      createFn = sinon.stub().returns($q.when());
      ContactAPIClient.addressbookHome = function(bookId) {
        expect(bookId).to.equal(session.user._id);

        return {
          addressbook: function(bookName) {
            expect(bookName).to.equal('contacts');

            return {
              vcard: function() {
                return {
                  create: createFn
                };
              }
            };
          }
        };
      };
    });

    it('should call ContactAPIClient to copy contact', function() {
      var contact = {
        id: '456'
      };

      contactService.copyContact('contacts', contact);
      $rootScope.$digest();
      expect(createFn).to.have.been.calledWith(contact);
    });

    it('should delete id of the contact that is about to copied', function() {
      var contact = {
        id: '456',
        addressbook: {
          bookName: 'contacts'
        }
      };

      contactService.copyContact('contacts', contact);
      $rootScope.$digest();
      expect(createFn).to.have.been.calledWith(contact);
      expect(contact.id).to.be.undefined;
    });
  });
});
