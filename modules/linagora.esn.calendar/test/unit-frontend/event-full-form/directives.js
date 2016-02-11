'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The event-full-form Angular module directives', function() {
  beforeEach(function() {
    module('jadeTemplates');
    angular.mock.module('esn.calendar');
    this.headerServiceMock = {
      subHeader: {
        addInjection: function() {},
        resetInjections: function() {}
      }
    };
    this.eventFormControllerMock = function($scope) {
      $scope.initFormData = function() {};
    };
    this.eventUtilsMock = {};

    var self = this;
    angular.mock.module(function($provide, $controllerProvider) {
      $controllerProvider.register('eventFormController', self.eventFormControllerMock);
      $provide.value('headerService', self.headerServiceMock);
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

  it('should reset eventUtils events by calling resetStoredEvents on element $destroy', function(done) {
    this.eventUtilsMock.resetStoredEvents = function() {
      done();
    };
    var element = this.initDirective(this.$scope);
    element.remove();
  });

  it('should call headerService to add a directive to the subheader', function(done) {
    this.headerServiceMock.subHeader.addInjection = function(directive) {
      expect(directive).to.equal('event-full-form-subheader');
      done();
    };
    this.initDirective(this.$scope);
  });
});
