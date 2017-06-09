'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The Contacts ui module', function() {

  beforeEach(function() {
    module('linagora.esn.contact');
  });

  describe('The displayContactError service', function() {

    var alertMock;

    beforeEach(function() {
      var self = this;

      self.$alert = function(args) {
        return alertMock(args);
      };

      angular.mock.module(function($provide) {
        $provide.value('$alert', self.$alert);
      });
    });

    beforeEach(angular.mock.inject(function(displayContactError) {
      this.displayContactError = displayContactError;
    }));

    it('should call the $alert service', function() {
      alertMock = sinon.spy();
      var err = 'This is the error';

      this.displayContactError(err);
      expect(alertMock).to.have.been.calledWith({
        content: err,
        type: 'danger',
        show: true,
        position: 'bottom',
        container: '.contact-error-container',
        duration: '3',
        animation: 'am-flip-x'
      });
    });
  });

  describe('The ContactListScrollingService service', function() {
    var $rootScope, $window, event, $scope, toggleMobileLetterFN;
    var ContactListScrollingService, sharedContactDataService, listScroller;
    var angularFind;
    var letterOffset = 0,
      contactHeaderOffset = 0;

    var angularFindResult = {
      h2: {
        getBoundingClientRect: function() {
          return {
            bottom: letterOffset
          };
        }
      },
      blockHeader: {
        textContent: 'A',
        getElementsByTagName: function() {
          return [angularFindResult.h2];
        }
      },
      contactHeader: {
        getBoundingClientRect: function() {
          return {
            bottom: contactHeaderOffset
          };
        }
      }
    };

    var element = {
      find: function() {
        return $([angularFindResult.blockHeader]);
      }
    };

    beforeEach(function() {
      // Simulate angular.element.find and restore after
      angularFind = angular.element.find;
      angular.element.find = function(value) {
        if (value === '.contact-list-subheader') {
          return [angularFindResult.contactHeader];
        }
      };
      angular.element.find.attr = angular.noop;

      inject(function(_$rootScope_, _$window_, _ContactListScrollingService_, _CONTACT_SCROLL_EVENTS_, _sharedContactDataService_) {
        $rootScope = _$rootScope_;
        $scope = $rootScope.$new();
        $window = _$window_;
        ContactListScrollingService = _ContactListScrollingService_;
        sharedContactDataService = _sharedContactDataService_;
        event = _CONTACT_SCROLL_EVENTS_;
      });
      $scope.headerDisplay = {};
      toggleMobileLetterFN = sinon.spy();
      listScroller = ContactListScrollingService(element, toggleMobileLetterFN);
      sharedContactDataService.categoryLetter = '#';
    });

    afterEach(function() {
      angular.element.find = angularFind;
      angular.element($window).off('scroll');
    });

    it('should not broadcast the letter when it is not hidden', function(done) {
      letterOffset = 100;
      contactHeaderOffset = 0;
      sharedContactDataService.categoryLetter = '';
      $scope.$on(event, function() {
        done('Error');
      });
      angular.element($window).triggerHandler('scroll');
      done();
    });

    it('should not broadcast the letter when it is not changed', function(done) {
      letterOffset = 100;
      contactHeaderOffset = 200;
      sharedContactDataService.categoryLetter = 'A';
      $scope.$on(event, function() {
        done('Error');
      });
      angular.element($window).triggerHandler('scroll');
      done();
    });

    it('should broadcast the letter when it is changed', function() {
      letterOffset = 100;
      contactHeaderOffset = 200;
      $scope.$on(event, function(evt, data) {
        expect(data).to.deep.equal('A');
      });
      angular.element($window).triggerHandler('scroll');
    });

    it('should toggle headerDisplay.mobileLetterVisibility if letter exists', function(done) {
      angular.element($window).triggerHandler('scroll');
      expect(toggleMobileLetterFN).to.have.been.calledOnce;
      done();
    });

    it('should return the function to remove scroll listener', function(done) {
      var angularElement = angular.element;

      angular.element = function() {
        return {
          off: function() {
            done();
          }
        };
      };

      listScroller.unregister();
      angular.element = angularElement;
    });

    it('should not cause error without callback', function(done) {
      listScroller = ContactListScrollingService(element);
      listScroller.onScroll();
      done();
    });
  });

  describe('The ContactListToggleDisplayService', function() {
    var ContactListToggleDisplayService,
      CONTACT_LIST_DISPLAY;

    var ContactListToggleEventServiceMock = {
      broadcast: function() {},
      listen: function() {}
    };

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

  describe('The ContactListToggleEventService service', function() {
    var $rootScope,
      ContactListToggleEventService,
      CONTACT_LIST_DISPLAY_EVENTS;

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

});
