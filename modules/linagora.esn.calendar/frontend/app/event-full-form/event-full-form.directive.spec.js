'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The cal-event-full-form Angular module directives', function() {
  beforeEach(function() {
    module('jadeTemplates');
    angular.mock.module('esn.calendar');
    this.calEventFormControllerMock = function($scope) {
      $scope.initFormData = function() {};
    };
    this.calEventUtilsMock = {};

    var self = this;

    angular.mock.module(function($provide, $controllerProvider) {
      $controllerProvider.register('calEventFormController', self.calEventFormControllerMock);
      $provide.value('calEventUtils', self.calEventUtilsMock);
      $provide.factory('calEventDateEditionDirective', function() { return {}; });
      $provide.factory('eventRecurrenceEditionDirective', function() { return {}; });
      $provide.factory('eventAlarmEditionDirective', function() { return {}; });
    });
  });

  beforeEach(angular.mock.inject(function($compile, $rootScope, calMoment) {
    this.$compile = $compile;
    this.$rootScope = $rootScope;
    this.$scope = this.$rootScope.$new();
    this.calMoment = calMoment;

    this.initDirective = function(scope) {
      var html = '<cal-event-full-form/>';
      var element = this.$compile(html)(scope);

      scope.$digest();

      return element;
    };
  }));

  it('should reset calEventUtils events by calling resetStoredEvents on element $destroy', function() {
    this.calEventUtilsMock.resetStoredEvents = sinon.spy();
    var element = this.initDirective(this.$scope);

    element.remove();
    expect(this.calEventUtilsMock.resetStoredEvents).to.have.been.calledOnce;
  });

});
