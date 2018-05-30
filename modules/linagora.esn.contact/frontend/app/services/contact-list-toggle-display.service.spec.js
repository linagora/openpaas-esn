'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The ContactListToggleDisplayService', function() {
  var ContactListToggleDisplayService,
    CONTACT_LIST_DISPLAY;

  var ContactListToggleEventServiceMock = {
    broadcast: function() {},
    listen: function() {}
  };

  beforeEach(function() {
    module('linagora.esn.contact');
  });

  beforeEach(function() {
    module(function($provide) {
      $provide.value('ContactListToggleEventService', ContactListToggleEventServiceMock);
    });
    inject(function(_ContactListToggleDisplayService_, _CONTACT_LIST_DISPLAY_) {
      ContactListToggleDisplayService = _ContactListToggleDisplayService_;
      CONTACT_LIST_DISPLAY = _CONTACT_LIST_DISPLAY_;
    });
  });

  describe('The getInitialDisplay function', function() {

    it('should return list as default value', function() {
      expect(ContactListToggleDisplayService.getInitialDisplay()).to.equal(CONTACT_LIST_DISPLAY.list);
    });

    it('should return the data from cache when current is not defined', function() {
      var value = CONTACT_LIST_DISPLAY.cards;

      ContactListToggleDisplayService._cacheValue(value);
      expect(ContactListToggleDisplayService.getInitialDisplay()).to.equal(value);
    });

  });

  describe('The getCurrentDisplay function', function() {

    it('should return list as default value when current is not defind', function() {
      expect(ContactListToggleDisplayService.getCurrentDisplay()).to.equal(CONTACT_LIST_DISPLAY.list);
    });

    it('should return the current value', function() {
      var value = 'foo';

      ContactListToggleDisplayService.setCurrentDisplay(value);
      expect(ContactListToggleDisplayService.getCurrentDisplay()).to.equal(value);
    });

  });

  describe('The setCurrentDisplay function', function() {
    it('should cache value', function() {
      var value = 'foo';

      ContactListToggleDisplayService.setCurrentDisplay(value);
      expect(ContactListToggleDisplayService._getCacheValue()).to.equal(value);
    });

    it('should cache value', function() {
      var value = 'foo';

      ContactListToggleDisplayService.setCurrentDisplay(value);
      expect(ContactListToggleDisplayService._getCacheValue()).to.equal(value);
    });

    it('should set current value', function() {
      var value = 'foo';

      ContactListToggleDisplayService.setCurrentDisplay(value);
      expect(ContactListToggleDisplayService.getCurrentDisplay()).to.equal(value);
    });

    it('should broadcast event', function(done) {
      var value = 'foo';

      ContactListToggleEventServiceMock.broadcast = function() {
        done();
      };
      ContactListToggleDisplayService.setCurrentDisplay(value);
      expect(ContactListToggleDisplayService.getCurrentDisplay()).to.equal(value);
    });

  });

  describe('The _getCache function', function() {
    it('should return an object', function() {
      expect(ContactListToggleDisplayService._getCache()).to.be.an.object;
    });
  });

  describe('The cache value functions', function() {
    it('should be able to get a cached value', function() {
      var value = 'foobar';

      ContactListToggleDisplayService._cacheValue(value);
      expect(ContactListToggleDisplayService._getCacheValue()).to.equal(value);
    });
  });
});
