'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The miniCalendar component', function() {
  beforeEach(function() {
    module('jadeTemplates');
    angular.mock.module('esn.calendar', 'linagora.esn.graceperiod');
  });

  describe('miniCalendarMobile directive', function() {
    beforeEach(angular.mock.inject(function($rootScope, $compile, $httpBackend, CALENDAR_EVENTS) {
      this.$httpBackend = $httpBackend;
      this.$rootScope = $rootScope;
      this.$scope = this.$rootScope.$new();
      this.$compile = $compile;
      this.CALENDAR_EVENTS = CALENDAR_EVENTS;

      this.initDirective = function(scope) {
        var html = '<mini-calendar-mobile calendar-id="123456" class="initial-state"></mini-calendar-mobile>';
        var element = this.$compile(html)(scope);

        scope.$digest();
        this.eleScope = element.isolateScope();

        return element;
      };

      this.$httpBackend.expectGET('/dav/api/calendars/undefined.json').respond(null);
    }));

    it('should remove toggle the mini-calendar on CALENDAR_EVENTS.MINI_CALENDAR.TOGGLE', function() {
      var element = this.initDirective(this.$scope);

      this.$rootScope.$broadcast(this.CALENDAR_EVENTS.MINI_CALENDAR.TOGGLE);
      this.$httpBackend.flush();
      expect(element.hasClass('initial-state')).to.be.false;
      expect(element.hasClass('display-none')).to.be.true;
    });
  });
});
