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

  describe('The addScrollingBehavior service', function() {
    var $rootScope, $window, event, $scope;
    var addScrollingBehavior, sharedContactDataService, scrollingBehavior;
    var angularFind;
    var letterOffset = 0,
      contactHeaderOffset = 0,
      contactControlOffset = 0;

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
      contactControl: {
        getBoundingClientRect: function() {
          return {
            bottom: contactHeaderOffset
          };
        }
      },
      contactHeader: {
        getBoundingClientRect: function() {
          return {
            bottom: contactControlOffset
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
        switch (value) {
          case '.contact-controls':
            return [angularFindResult.contactControl];
          case '.contacts-list-header':
            return [angularFindResult.contactHeader];
        }
      };

      inject(function(_$rootScope_, _$window_, _addScrollingBehavior_, _CONTACT_SCROLL_EVENTS_, _sharedContactDataService_) {
        $rootScope = _$rootScope_;
        $scope = $rootScope.$new();
        $window = _$window_;
        addScrollingBehavior = _addScrollingBehavior_;
        sharedContactDataService = _sharedContactDataService_;
        event = _CONTACT_SCROLL_EVENTS_;
      });

      scrollingBehavior = addScrollingBehavior(element);
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

    it('should return the function to remove scroll listener', function(done) {
      var angularElement = angular.element;
      angular.element = function() {
        return {
          off: function() {
            done();
          }
        };
      };

      scrollingBehavior.unregister();
      angular.element = angularElement;
    });
  });

  describe('The toggleContactDisplayService', function() {
    var $rootScope,
      $cacheFactory,
      toggleContactDisplayService,
      toggleEventService,
      CONTACT_LIST_DISPLAY,
      CONTACT_LIST_DISPLAY_EVENTS;

    var toggleEventServiceMock = {
      broadcast: function() {},
      listen: function() {}
    };

    beforeEach(function() {

      module(function($provide) {
        $provide.value('toggleEventService', toggleEventServiceMock);
      });
      inject(function(_$rootScope_, _toggleContactDisplayService_, _toggleEventService_, _CONTACT_LIST_DISPLAY_, _CONTACT_LIST_DISPLAY_EVENTS_, _$cacheFactory_) {
        $rootScope = _$rootScope_;
        toggleContactDisplayService = _toggleContactDisplayService_;
        toggleEventService = _toggleEventService_;
        CONTACT_LIST_DISPLAY = _CONTACT_LIST_DISPLAY_;
        CONTACT_LIST_DISPLAY_EVENTS = _CONTACT_LIST_DISPLAY_EVENTS_;
        $cacheFactory = _$cacheFactory_;
      });
    });

    describe('The getInitialDisplay function', function() {

      it('should return list as default value', function() {
        expect(toggleContactDisplayService.getInitialDisplay()).to.equal(CONTACT_LIST_DISPLAY.list);
      });

      it('should return the data from cache when current is not defined', function() {
        var value = CONTACT_LIST_DISPLAY.cards;
        toggleContactDisplayService._cacheValue(value);
        expect(toggleContactDisplayService.getInitialDisplay()).to.equal(value);
      });

    });

    describe('The getCurrentDisplay function', function() {

      it('should return list as default value when current is not defind', function() {
        expect(toggleContactDisplayService.getCurrentDisplay()).to.equal(CONTACT_LIST_DISPLAY.list);
      });

      it('should return the current value', function() {
        var value = 'foo';
        toggleContactDisplayService.setCurrentDisplay(value);
        expect(toggleContactDisplayService.getCurrentDisplay()).to.equal(value);
      });

    });

    describe('The setCurrentDisplay function', function() {
      it('should cache value', function() {
        var value = 'foo';
        toggleContactDisplayService.setCurrentDisplay(value);
        expect(toggleContactDisplayService._getCacheValue()).to.equal(value);
      });

      it('should cache value', function() {
        var value = 'foo';
        toggleContactDisplayService.setCurrentDisplay(value);
        expect(toggleContactDisplayService._getCacheValue()).to.equal(value);
      });

      it('should set current value', function() {
        var value = 'foo';
        toggleContactDisplayService.setCurrentDisplay(value);
        expect(toggleContactDisplayService.getCurrentDisplay()).to.equal(value);
      });

      it('should broadcast event', function(done) {
        var value = 'foo';
        toggleEventServiceMock.broadcast = function() {
          done();
        };
        toggleContactDisplayService.setCurrentDisplay(value);
        expect(toggleContactDisplayService.getCurrentDisplay()).to.equal(value);
      });

    });

    describe('The _getCache function', function() {
      it('should return an object', function() {
        expect(toggleContactDisplayService._getCache()).to.be.an.object;
      });
    });

    describe('The cache value functions', function() {
      it('should be able to get a cached value', function() {
        var value = 'foobar';
        toggleContactDisplayService._cacheValue(value);
        expect(toggleContactDisplayService._getCacheValue()).to.equal(value);
      });
    });
  });

  describe('The toggleEventService service', function() {
    var $rootScope,
      toggleEventService,
      CONTACT_LIST_DISPLAY_EVENTS;

    beforeEach(function() {
      inject(function(_$rootScope_, _toggleEventService_, _CONTACT_LIST_DISPLAY_EVENTS_) {
        $rootScope = _$rootScope_;
        toggleEventService = _toggleEventService_;
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

        toggleEventService.broadcast(data);
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
        toggleEventService.listen(scope, eventCallback);
      });

      it('should call event callback', function(done) {
        var event = 'My event';
        var scope = $rootScope.$new();
        function callback(evt, data) {
          expect(data).to.equal(event);
          done();
        }
        toggleEventService.listen(scope, callback);
        toggleEventService.broadcast(event);
      });
    });

  });

});
