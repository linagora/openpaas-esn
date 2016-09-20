'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The calendarVisibilityService', function() {
  var self;

  beforeEach(function() {
    self = this;
    angular.mock.module('esn.calendar');
  });

  beforeEach(angular.mock.inject(function(calendarVisibilityService, $rootScope, CALENDAR_EVENTS) {
    self.calendarVisibilityService = calendarVisibilityService;
    self.$rootScope = $rootScope;
    self.CALENDAR_EVENTS = CALENDAR_EVENTS;
  }));

  describe('getHiddenCalendars function', function() {
    it('should initially return no calendar', function() {
      expect(this.calendarVisibilityService.getHiddenCalendars()).to.deep.equal([]);
    });

    it('should return previous hidden calendar', function() {
      var hiddenCalendars = [{id: 1}, {id: 2}];
      hiddenCalendars.map(this.calendarVisibilityService.toggle);
      expect(this.calendarVisibilityService.getHiddenCalendars()).to.deep.equal(hiddenCalendars);
    });

    it('should not return unhidden calendar', function() {
      var hiddenCalendars = [{id: 1}, {id: 2}];
      hiddenCalendars.map(this.calendarVisibilityService.toggle);

      this.calendarVisibilityService.toggle(hiddenCalendars[0]);
      expect(this.calendarVisibilityService.getHiddenCalendars()).to.deep.equal([hiddenCalendars[1]]);
    });
  });

  describe('the toggle function', function() {
    it('should broadcast the calendar and it new display status', function() {
      var cal = {id: 42};

      this.$rootScope.$broadcast = sinon.spy();

      this.calendarVisibilityService.toggle(cal);
      expect(this.$rootScope.$broadcast.firstCall).to.have.been.calledWith(this.CALENDAR_EVENTS.CALENDARS.TOGGLE_VIEW, {calendar: cal, hidden: true});

      this.calendarVisibilityService.toggle(cal);
      expect(this.$rootScope.$broadcast.secondCall).to.have.been.calledWith(this.CALENDAR_EVENTS.CALENDARS.TOGGLE_VIEW, {calendar: cal, hidden: false});
    });
  });

  describe('The isHidden function', function() {
    it('should true if and only if the calendar is hidden', function() {
      var cal = {id: 42};

      expect(this.calendarVisibilityService.isHidden(cal)).to.be.false;
      this.calendarVisibilityService.toggle(cal);
      expect(this.calendarVisibilityService.isHidden(cal)).to.be.true;
    });
  });
});
