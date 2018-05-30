'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The contactListItems directive', function() {
  var $compile, $rootScope, $scope, CONTACT_EVENTS, $timeout, triggerScroll;
  var ContactListScrollingServiceMock, sharedContactDataServiceMock, categoryLetter, onScroll, unregister;

  beforeEach(function() {
    module('esn.core');
    module('linagora.esn.contact');
    module('jadeTemplates');
  });

  beforeEach(function() {
    ContactListScrollingServiceMock = function(element, callback) {
      if (triggerScroll) {
        callback();
      }

      return {
        onScroll: onScroll,
        unregister: unregister
      };
    };

    module(function($provide) {
      $provide.value('ContactListScrollingService', ContactListScrollingServiceMock);
      $provide.value('sharedContactDataService', { categoryLetter: categoryLetter });
    });

    inject(function(_$compile_, _$rootScope_, _CONTACT_EVENTS_, _$timeout_, _sharedContactDataService_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      CONTACT_EVENTS = _CONTACT_EVENTS_;
      $timeout = _$timeout_;
      sharedContactDataServiceMock = _sharedContactDataService_;
    });

    $scope.headerDisplay = {
      letterExists: true
    };

  });

  function initDirective() {
    var element = $compile('<contact-list-items></contact-list-items>')($scope);
    $scope.$digest();
    return element;
  }

  it('should remove scroll listener when scope is destroyed', function(done) {
    unregister = done();
    initDirective();
    $scope.$destroy();
  });

  it('should init the headerDisplay letterExists to false', function() {
    initDirective();
    expect($scope.headerDisplay.letterExists).is.false;
  });

  it('should listen all contact event to update letter', function() {
    onScroll = sinon.spy();
    initDirective();
    angular.forEach(CONTACT_EVENTS, function(event) {
      $rootScope.$broadcast(event);
    });
    $timeout.flush();
    expect(onScroll.callCount).to.be.equal(Object.keys(CONTACT_EVENTS).length);
  });

  it('should update headerDisplay.mobileLetterVisibility when categoryLetter exists', function() {
    triggerScroll = true;
    sharedContactDataServiceMock.categoryLetter = 'A';
    initDirective();
    expect($scope.headerDisplay.mobileLetterVisibility).is.true;
    $timeout.flush();
    expect($scope.headerDisplay.mobileLetterVisibility).is.false;
  });

  it('should set headerDisplay.mobileLetterVisibility false when categoryLetter does not exists', function() {
    triggerScroll = true;
    sharedContactDataServiceMock.categoryLetter = '';
    initDirective();
    expect($scope.headerDisplay.mobileLetterVisibility).is.false;
  });
});
