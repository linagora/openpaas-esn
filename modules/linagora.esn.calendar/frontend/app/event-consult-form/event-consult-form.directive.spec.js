'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The cal-event-consult-form Angular module directives', function() {
  var updateAlarmSpy;

  describe('the calEventConsultForm directive', function() {
    beforeEach(function() {
      module('jadeTemplates');
      angular.mock.module('esn.calendar');
      updateAlarmSpy = sinon.spy(function() {});
      this.calEventFormControllerMock = function($scope) {
        $scope.initFormData = function() {
        };
        $scope.updateAlarm = updateAlarmSpy;
      };

      var self = this;

      angular.mock.module(function($provide, $controllerProvider) {
        $controllerProvider.register('CalEventFormController', self.calEventFormControllerMock);
        $provide.factory('eventAlarmConsultationDirective', function() { return {}; });
      });
    });

    beforeEach(angular.mock.inject(function($compile, $rootScope, $window, calMoment, CAL_CONSULT_FORM_TABS, CalendarShell, moment) {
      this.$compile = $compile;
      this.$rootScope = $rootScope;
      this.$scope = this.$rootScope.$new();
      this.calMoment = calMoment;
      this.$window = $window;
      this.TABS = CAL_CONSULT_FORM_TABS;
      this.CalendarShell = CalendarShell;
      this.moment = moment;

      this.$scope.event = this.CalendarShell.fromIncompleteShell({
        start: this.calMoment('2013-02-08'),
        end: this.calMoment('2013-02-08'),
        location: 'aLocation'
      });

      this.initDirective = function(scope) {
        var html = '<cal-event-consult-form event="event"/>';
        var element = this.$compile(html)(scope);

        scope.$digest();

        return element;
      };
    }));

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

    it('should call changeConsultState to update alarm when click save', function() {
      this.$scope.event = this.CalendarShell.fromIncompleteShell({
        start: this.moment('2013-02-08 12:30'),
        end: this.moment('2013-02-08 13:30'),
        location: 'aLocation',
        alarm: {
          trigger: '-PT1M',
          attendee: 'test@open-paas.org'
        }
      });

      var element = this.initDirective(this.$scope);

      element.isolateScope().isEdit = true;
      element.isolateScope().editedEvent = element.isolateScope().event.clone();
      element.isolateScope().editedEvent.alarm = {
        trigger: '-P2D',
        attendee: 'test@open-paas.org'
      };

      element.isolateScope().changeConsultState();
      expect(updateAlarmSpy).to.have.been.called;
    });
  });
});
