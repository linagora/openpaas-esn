'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The ContactListToggleEventService service', function() {
  var $rootScope,
    ContactListToggleEventService,
    CONTACT_LIST_DISPLAY_EVENTS;

  beforeEach(function() {
    module('linagora.esn.contact');
  });

  beforeEach(function() {
    inject(function(_$rootScope_, _ContactListToggleEventService_, _CONTACT_LIST_DISPLAY_EVENTS_) {
      $rootScope = _$rootScope_;
      ContactListToggleEventService = _ContactListToggleEventService_;
      CONTACT_LIST_DISPLAY_EVENTS = _CONTACT_LIST_DISPLAY_EVENTS_;
    });
  });

  describe('The broadcast function', function() {
    it('should call $rootScope.$broadcast with toggle event', function(done) {
      var data = 'My event';

      $rootScope.$on(CONTACT_LIST_DISPLAY_EVENTS.toggle, function(evt, value) {
        expect(value).to.equal(data);
        done();
      });

      ContactListToggleEventService.broadcast(data);
    });
  });

  describe('The listen function', function() {
    it('should listen to toggle event', function(done) {
      var eventCallback = function() {};
      var scope = {
        $on: function(event, callback) {
          expect(CONTACT_LIST_DISPLAY_EVENTS.toggle).to.equal(event);
          expect(callback).to.equal(eventCallback);
          done();
        }
      };

      ContactListToggleEventService.listen(scope, eventCallback);
    });

    it('should call event callback', function(done) {
      var event = 'My event';
      var scope = $rootScope.$new();

      function callback(evt, data) {
        expect(data).to.equal(event);
        done();
      }
      ContactListToggleEventService.listen(scope, callback);
      ContactListToggleEventService.broadcast(event);
    });
  });
});
