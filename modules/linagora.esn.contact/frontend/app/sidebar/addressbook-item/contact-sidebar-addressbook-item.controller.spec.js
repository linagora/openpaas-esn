'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The ContactSidebarAddressbookItemController controller', function() {
  var $rootScope, $controller;

  beforeEach(function() {
    module('linagora.esn.contact');

    inject(function(
      _$controller_,
      _$rootScope_
    ) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
    });

  });

  function initController(addressbookDisplayShell) {
    var $scope = $rootScope.$new();
    var controller = $controller('ContactSidebarAddressbookItemController', { $scope: $scope });

    controller.addressbookDisplayShell = addressbookDisplayShell;
    controller.$onInit();
    $scope.$digest();

    return controller;
  }

  it('should set validAction to be empty if there are no valid actions on addressbook display shell', function() {
    var addressbookDisplayShell = {
      shell: { isSubscription: angular.noop }
    };
    var controller = initController(addressbookDisplayShell);

    expect(controller.actions).to.be.empty;
  });

  it('should set containsValidActions to true if there are valid actions on addressbook display shell', function() {
    var addressbookDisplayShell = {
      actions: [{
        name: 'Action1',
        when: function() { return true; }
      }],
      shell: { isSubscription: angular.noop }
    };
    var controller = initController(addressbookDisplayShell);

    expect(controller.actions).to.shallowDeepEqual(addressbookDisplayShell.actions);
  });

  it('should filter out only valid actions on addressbook display shell', function() {
    var addressbookDisplayShell = {
      actions: [{
        name: 'Action1',
        when: function() { return true; }
      }, {
        name: 'Action2',
        when: function() { return true; }
      }, {
        name: 'Action3',
        when: function() { return false; }
      }],
      shell: { isSubscription: angular.noop }
    };
    var controller = initController(addressbookDisplayShell);

    expect(controller.actions).to.shallowDeepEqual(addressbookDisplayShell.actions.slice(0, 2));
  });
});
