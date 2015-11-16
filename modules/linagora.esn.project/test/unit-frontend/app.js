'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.project module', function() {
  var dynamicDirectiveService;

  beforeEach(function() {
    angular.mock.module('op.dynamicDirective');
    angular.mock.module('esn.project');
    inject(function(_dynamicDirectiveService_) {
      dynamicDirectiveService = _dynamicDirectiveService_;
    });
  });

  it('should inject the sidebar dynamic directive', function() {
    var injections = dynamicDirectiveService.getInjections('esn-sidebar-app-menu', {});
    var inboxMenuInjections = injections.filter(function(injection) { return injection.name === 'list-project-activity-streams'; });
    expect(inboxMenuInjections).to.have.length(1);
  });

});
