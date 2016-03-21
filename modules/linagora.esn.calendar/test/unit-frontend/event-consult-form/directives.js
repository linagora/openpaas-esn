'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The event-consult-form Angular module directives', function() {

  describe('the eventConsultForm directive', function() {
    beforeEach(function() {
      module('jadeTemplates');
      angular.mock.module('esn.calendar');
      this.headerServiceMock = {
        subHeader: {
          addInjection: function() {
          },
          resetInjections: function() {
          }
        }
      };
      this.eventFormControllerMock = function($scope) {
        $scope.initFormData = function() {
        };
      };

      var self = this;
      angular.mock.module(function($provide, $controllerProvider) {
        $controllerProvider.register('eventFormController', self.eventFormControllerMock);
        $provide.value('headerService', self.headerServiceMock);
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

    it('should reset subheader injections on element $destroy', function(done) {
      this.headerServiceMock.subHeader.resetInjections = done;
      var element = this.initDirective(this.$scope);
      element.remove();
    });

    it('should call headerService to add a directive to the subheader', function(done) {
      this.headerServiceMock.subHeader.addInjection = function(directive) {
        expect(directive).to.equal('event-consult-form-subheader');
        done();
      };
      this.initDirective(this.$scope);
    });

    it('should initialize scope.selectedTab to MAIN', function() {
      var element = this.initDirective(this.$scope);
      expect(element.isolateScope().selectedTab).to.equal(this.TABS.MAIN);
    });

    describe('The onSwipe function', function() {
      it('should call scope.onSwipe left from tab MAIN to tab ATTENDEES', function() {
        var element = this.initDirective(this.$scope);
        element.isolateScope().selectedTab = this.TABS.MAIN;
        element.isolateScope().onSwipe('left');
        expect(element.isolateScope().selectedTab).to.equal(this.TABS.ATTENDEES);
      });

      it('should call scope.onSwipe left from tab ATTENDEES to tab MORE', function() {
        var element = this.initDirective(this.$scope);
        element.isolateScope().selectedTab = this.TABS.ATTENDEES;
        element.isolateScope().onSwipe('left');
        expect(element.isolateScope().selectedTab).to.equal(this.TABS.MORE);
      });

      it('should call scope.onSwipe right from tab MORE to tab ATTENDEES', function() {
        var element = this.initDirective(this.$scope);
        element.isolateScope().selectedTab = this.TABS.MORE;
        element.isolateScope().onSwipe('right');
        expect(element.isolateScope().selectedTab).to.equal(this.TABS.ATTENDEES);
      });

      it('should call scope.onSwipe right from tab MAIN', function() {
        var element = this.initDirective(this.$scope);
        element.isolateScope().selectedTab = this.TABS.MAIN;
        element.isolateScope().onSwipe('right');
        expect(element.isolateScope().selectedTab).to.equal(this.TABS.MAIN);
      });

      it('should call scope.onSwipe left from tab MORE', function() {
        var element = this.initDirective(this.$scope);
        element.isolateScope().selectedTab = this.TABS.MORE;
        element.isolateScope().onSwipe('left');
        expect(element.isolateScope().selectedTab).to.equal(this.TABS.MORE);
      });
    });
  });
});
