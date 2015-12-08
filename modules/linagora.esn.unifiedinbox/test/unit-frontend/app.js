'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The linagora.esn.unifiedinbox module', function() {
  var dynamicDirectiveService;

  beforeEach(function() {
    angular.mock.module('esn.core');
    angular.mock.module('esn.notification');
    angular.mock.module('op.dynamicDirective');
    angular.mock.module('linagora.esn.unifiedinbox');
    inject(function(_dynamicDirectiveService_) {
      dynamicDirectiveService = _dynamicDirectiveService_;
    });
  });

  it('should inject the sidebar dynamic directive', function() {
    var injections = dynamicDirectiveService.getInjections('esn-sidebar-app-menu', {});
    var inboxMenuInjections = injections.filter(function(injection) { return injection.name === 'inbox-menu'; });
    expect(inboxMenuInjections).to.have.length(1);
  });

});
