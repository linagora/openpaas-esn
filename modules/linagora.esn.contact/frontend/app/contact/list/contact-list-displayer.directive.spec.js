'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The contactListDisplayer directive', function() {

  var $rootScope, $compile, $scope, ContactListToggleDisplayService, ContactListToggleEventService, ContactListToggleDisplayServiceMock;

  beforeEach(function() {
    module('esn.core');
    module('linagora.esn.contact');
    module('jadeTemplates');
  });

  beforeEach(function() {

    ContactListToggleDisplayServiceMock = {
      getCurrentDisplay: function() {
      },
      setCurrentDisplay: function() {
      }
    };

    module(function($provide) {
      $provide.value('ContactListToggleDisplayService', ContactListToggleDisplayServiceMock);
    });

    inject(function(_$rootScope_, _$compile_, _ContactListToggleDisplayService_, _ContactListToggleEventService_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      ContactListToggleDisplayService = _ContactListToggleDisplayService_;
      ContactListToggleEventService = _ContactListToggleEventService_;
      $scope = $rootScope.$new();
    });
  });

  function initDirective() {
    return $compile('<contact-list-displayer></contact-list-displayer>')($scope);
  }

  it('should set displayAs with the ContactListToggleDisplayService value', function() {
    var value = 'the value';

    ContactListToggleDisplayServiceMock.getCurrentDisplay = function() {
      return value;
    };

    initDirective();
    $scope.$digest();

    expect($scope.displayAs).to.equal(value);
  });

  it('should set displayAs with the ContactListToggleEventService.broadcast event value', function() {
    var value = 'the value';

    initDirective();
    $scope.$digest();
    ContactListToggleEventService.broadcast(value);

    expect($scope.displayAs).to.equal(value);
  });

  it('should save the current value when changing location', function(done) {
    var value = 'my value';

    ContactListToggleDisplayServiceMock.setCurrentDisplay = function(display) {
      expect(display).to.equal(value);
      done();
    };
    ContactListToggleDisplayService.getCurrentDisplay = function() {
      return value;
    };
    initDirective();
    $scope.$digest();
    $scope.$emit('$locationChangeStart');
  });
});
