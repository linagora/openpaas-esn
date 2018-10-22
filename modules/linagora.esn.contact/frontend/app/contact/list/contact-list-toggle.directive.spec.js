'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The contactListToggle directive', function() {

  var $compile, $rootScope, element, $scope, ContactListToggleDisplayService, ContactListToggleEventService, ContactListToggleDisplayServiceMock, CONTACT_LIST_DISPLAY;

  beforeEach(function() {
    module('esn.core');
    module('linagora.esn.contact');
    module('jadeTemplates');
  });

  beforeEach(function() {

    ContactListToggleDisplayServiceMock = {
      getCurrentDisplay: function() {},
      setCurrentDisplay: function() {}
    };

    module(function($provide) {
      $provide.value('ContactListToggleDisplayService', ContactListToggleDisplayServiceMock);
    });

    inject(function(_$compile_, _$rootScope_, _ContactListToggleDisplayService_, _ContactListToggleEventService_, _CONTACT_LIST_DISPLAY_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      ContactListToggleDisplayService = _ContactListToggleDisplayService_;
      ContactListToggleEventService = _ContactListToggleEventService_;
      CONTACT_LIST_DISPLAY = _CONTACT_LIST_DISPLAY_;
      $scope = $rootScope.$new();
      $scope.displayAs = CONTACT_LIST_DISPLAY.list;
    });
  });

  var initDirective = function() {
    return $compile('<contact-list-toggle></contact-list-toggle>')($scope);
  };

  it('should highlight list text list at start', function() {
    element = initDirective();
    $scope.$digest();
    expect(element.find('.list-item')).to.have.length(1);
    expect(element.find('.card-item')).to.have.length(0);
  });

  it('should highlight card text when clicking on toggle button', function() {
    element = initDirective();
    $scope.$digest();
    element.find('.list-item').click();
    ContactListToggleEventService.broadcast(CONTACT_LIST_DISPLAY.cards);
    $scope.$digest();

    expect(element.find('.list-item')).to.have.length(0);
    expect(element.find('.card-item')).to.have.length(1);
  });

  it('should switch back to initial state when clicking on toggle 2 times', function() {
    element = initDirective();
    $scope.$digest();
    element.find('.list-item').click();
    element.find('.card-item').click();
    ContactListToggleEventService.broadcast(CONTACT_LIST_DISPLAY.list);
    $scope.$digest();

    expect(element.find('.list-item')).to.have.length(1);
    expect(element.find('.card-item')).to.have.length(0);
  });

  it('should have toggleContactDisplay to false when current display is CONTACT_LIST_DISPLAY.list', function() {
    ContactListToggleDisplayServiceMock.getCurrentDisplay = function() {
      return CONTACT_LIST_DISPLAY.list;
    };

    initDirective();
    $scope.$digest();
    expect($scope.toggleContactDisplay).to.be.false;
  });

  it('should have toggleContactDisplay to true when current display is CONTACT_LIST_DISPLAY.cards', function() {
    ContactListToggleDisplayServiceMock.getCurrentDisplay = function() {
      return CONTACT_LIST_DISPLAY.cards;
    };

    initDirective();
    $scope.$digest();
    expect($scope.toggleContactDisplay).to.be.true;
  });

  describe('The toggle event listener', function() {

    it('should not update toggleContactDisplay when toggle event is for card display', function() {
      $scope.toggleContactDisplay = true;
      initDirective();
      $scope.$digest();
      ContactListToggleEventService.broadcast(CONTACT_LIST_DISPLAY.cards);
      expect($scope.toggleContactDisplay).to.be.true;
    });

    it('should update toggleContactDisplay when toggle event is for list display', function() {
      $scope.toggleContactDisplay = true;
      initDirective();
      $scope.$digest();
      ContactListToggleEventService.broadcast(CONTACT_LIST_DISPLAY.list);
      expect($scope.toggleContactDisplay).to.be.false;
    });
  });

  describe('The updateDisplay function', function() {

    it('should save the card display when called with true', function(done) {
      ContactListToggleDisplayService.setCurrentDisplay = function(value) {
        expect(value).to.equal(CONTACT_LIST_DISPLAY.cards);
        done();
      };
      initDirective();
      $scope.$digest();
      $scope.updateDisplay(true);
    });

    it('should save the list display when called with true', function(done) {
      ContactListToggleDisplayService.setCurrentDisplay = function(value) {
        expect(value).to.equal(CONTACT_LIST_DISPLAY.list);
        done();
      };
      initDirective();
      $scope.$digest();
      $scope.updateDisplay(false);
    });
  });
});
