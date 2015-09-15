'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The event-full-form Angular module directives', function() {
  beforeEach(function() {
    module('jadeTemplates');
    angular.mock.module('esn.calendar');
    this.gracePeriodService = {};

    var self = this;
    angular.mock.module(function($provide) {
      $provide.value('gracePeriodService', self.gracePeriodService);
    });
  });

  beforeEach(angular.mock.inject(function($compile, $rootScope, $timeout, eventService) {
    this.$compile = $compile;
    this.$rootScope = $rootScope;
    this.$timeout = $timeout;
    this.$scope = this.$rootScope.$new();
    this.eventService = eventService;

    this.initDirective = function(scope) {
      var html = '<event-full-form/>';
      var element = this.$compile(html)(scope);
      scope.$digest();
      return element;
    };
  }));

  it('should reset eventService events on element $destroy', function() {
    this.eventService.originalEvent = { aEvent: 'aEvent' };
    this.eventService.editedEvent = { aEvent: 'aEvent' };
    var element = this.initDirective(this.$scope);
    element.remove();

    expect(this.eventService.originalEvent).to.deep.equal({});
    expect(this.eventService.editedEvent).to.deep.equal({});
  });

  describe('scope.goBack', function() {
    it('should $timeout the callback function in argument', function(done) {
      this.initDirective(this.$scope);
      this.$scope.goBack(done);
      this.$timeout.flush();
    });
  });
});
