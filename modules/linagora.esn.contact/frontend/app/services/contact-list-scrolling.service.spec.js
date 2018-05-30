'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

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
    module('linagora.esn.contact');
  });

  beforeEach(function() {
    // Simulate angular.element.find and restore after
    angularFind = angular.element.find;
    angular.element.find = function(value) {
      if (value === 'contact-list-subheader') {
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
