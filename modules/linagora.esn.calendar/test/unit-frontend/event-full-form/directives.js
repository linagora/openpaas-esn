'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The event-full-form Angular module directives', function() {
  beforeEach(function() {
    module('jadeTemplates');
    angular.mock.module('esn.calendar');
    this.eventFormControllerMock = function($scope) {
      $scope.initFormData = function() {};
    };
    this.eventUtilsMock = {};

    var self = this;
    angular.mock.module(function($provide, $controllerProvider) {
      $controllerProvider.register('eventFormController', self.eventFormControllerMock);
      $provide.value('eventUtils', self.eventUtilsMock);
      $provide.factory('eventDateEditionDirective', function() { return {}; });
      $provide.factory('eventRecurrenceEditionDirective', function() { return {}; });
    });
  });

  beforeEach(angular.mock.inject(function($compile, $rootScope, fcMoment) {
    this.$compile = $compile;
    this.$rootScope = $rootScope;
    this.$scope = this.$rootScope.$new();
    this.fcMoment = fcMoment;

    this.initDirective = function(scope) {
      var html = '<event-full-form/>';
      var element = this.$compile(html)(scope);
      scope.$digest();
      return element;
    };
  }));

  it('should reset eventUtils events by calling resetStoredEvents on element $destroy', function() {
    this.eventUtilsMock.resetStoredEvents = sinon.spy();
    var element = this.initDirective(this.$scope);
    element.remove();
    expect(this.eventUtilsMock.resetStoredEvents).to.have.been.calledOnce;
  });

});
