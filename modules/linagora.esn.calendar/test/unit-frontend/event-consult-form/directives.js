'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The event-consult-form Angular module directives', function() {

  describe('the eventConsultForm directive', function() {
    beforeEach(function() {
      module('jadeTemplates');
      angular.mock.module('esn.calendar');
      this.eventFormControllerMock = function($scope) {
        $scope.initFormData = function() {
        };
      };

      var self = this;
      angular.mock.module(function($provide, $controllerProvider) {
        $controllerProvider.register('eventFormController', self.eventFormControllerMock);
      });
    });

    beforeEach(angular.mock.inject(function($compile, $rootScope, $window, fcMoment, CONSULT_FORM_TABS) {
      this.$compile = $compile;
      this.$rootScope = $rootScope;
      this.$scope = this.$rootScope.$new();
      this.fcMoment = fcMoment;
      this.$window = $window;
      this.TABS = CONSULT_FORM_TABS;

      this.$scope.event = {
        allDay: true,
        start: this.fcMoment('2013-02-08 12:30'),
        end: this.fcMoment('2013-02-08 13:30'),
        location: 'aLocation'
      };

      this.initDirective = function(scope) {
        var html = '<event-consult-form event="event"/>';
        var element = this.$compile(html)(scope);
        scope.$digest();
        return element;
      };
    }));

    it('should initialize scope.selectedTab to MAIN', function() {
      var element = this.initDirective(this.$scope);
      expect(element.isolateScope().selectedTab).to.equal(this.TABS.MAIN);
    });
  });
});
