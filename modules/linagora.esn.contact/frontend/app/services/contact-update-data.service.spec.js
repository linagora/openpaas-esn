'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The contactUpdateDataService service', function() {
  var $rootScope;
  var contactUpdateDataService;
  var CONTACT_EVENTS;

  beforeEach(function() {
    module('linagora.esn.contact');
  });

  beforeEach(inject(function(
    _$rootScope_,
    _contactUpdateDataService_,
    _CONTACT_EVENTS_
  ) {
    contactUpdateDataService = _contactUpdateDataService_;
    $rootScope = _$rootScope_;
    CONTACT_EVENTS = _CONTACT_EVENTS_;
  }));

  describe('on CONTACT_EVENTS.UPDATED event', function() {
    it('should update contact ETag if contact ID matches', function() {
      contactUpdateDataService.contact = {
        id: 'contactId',
        etag: 'etag'
      };

      $rootScope.$emit(CONTACT_EVENTS.UPDATED, {
        id: 'contactId',
        etag: 'newEtag'
      });

      expect(contactUpdateDataService.contact.etag).to.equal('newEtag');
    });

    it('should not update contact ETag if contact Id does not match', function() {
      contactUpdateDataService.contact = {
        id: 'contactId',
        etag: 'etag'
      };

      $rootScope.$emit(CONTACT_EVENTS.UPDATED, {
        id: 'other contactId',
        etag: 'newEtag'
      });

      expect(contactUpdateDataService.contact.etag).to.equal('etag');
    });
  });
});
