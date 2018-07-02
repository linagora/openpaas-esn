'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esnUserNotificationListItem directive', function() {
  var $compile, $scope, $rootScope;
  var registry = {
    category: 'test:notification',
    template: 'test-notification'
  };
  var registryForceCloseOnClick = {
    category: 'test:notification:forceCloseOnClick',
    template: 'test-notification-force-close-on-click',
    forceClosePopoverOnClick: true
  };

  beforeEach(function() {
    angular.module('test.moduleA', ['esn.user-notification'])
      .run(function(
        $templateCache,
        esnUserNotificationTemplateProviderRegistry
      ) {
        $templateCache.put('test-notification.html', '<div></div>');
        esnUserNotificationTemplateProviderRegistry.add(registry);
      })
      .component('testNotification', {
        templateUrl: 'test-notification.html',
        bindings: {
          notification: '='
        }
      });

    angular.module('test.moduleB', ['esn.user-notification'])
      .run(function(
        $templateCache,
        esnUserNotificationTemplateProviderRegistry
      ) {
        $templateCache.put('test-notification-force-close-on-click.html', '<div></div>');
        esnUserNotificationTemplateProviderRegistry.add(registryForceCloseOnClick);
      })
      .component('testNotificationForceCloseOnClick', {
        templateUrl: 'test-notification-force-close-on-click.html',
        bindings: {
          notification: '='
        }
      });
    module('jadeTemplates', 'esn.user-notification', 'test.moduleA', 'test.moduleB');
  });

  beforeEach(inject(function(
    _$compile_,
    _$rootScope_
  ) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $scope = $rootScope.$new();
  }));

  function initDirective(scope) {
    var element = $compile('<esn-user-notification-list-item notification="notification" />')(scope);

    scope.$digest();

    return element;
  }

  it('should compile the notification template that matches with the notification category from providers', function() {
    $scope.notification = { category: registry.category };

    var element = initDirective($scope);

    expect(element.find(registry.template)).to.have.length(1);
  });

  it('should compile the notification template that force close popover on click when provider set forceClosePopoverOnClick is true', function() {
    $scope.notification = { category: registryForceCloseOnClick.category };
    var element = initDirective($scope);

    expect(element.find(registryForceCloseOnClick.template)).to.have.length(1);
    expect(element.find('.user-notification-list-item').attr('ng-click')).to.equal('hidePopover()');
  });

  it('should use default extra notification template in case of no matching template from providers', function() {
    $scope.notification = {
      category: 'should-not-be-found',
      subject: {
        objectType: 'test'
      },
      description: 'This is an external notification',
      acknowledged: true
    };

    var element = initDirective($scope);

    expect(element.find('.media').hasClass('ng-isolate-scope')).to.be.true;
    expect(element.find('.media').attr('notification')).to.equal('notification');
  });
});
