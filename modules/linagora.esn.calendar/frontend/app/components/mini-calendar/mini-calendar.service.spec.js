'use strict';

/* global chai: false */
/* global sinon: false */
/* global moment: false */

var expect = chai.expect;

describe('The mini-calendar service', function() {

  beforeEach(function() {
    angular.mock.module('esn.calendar', 'linagora.esn.graceperiod');
    moment.tz.setDefault('Europe/Paris');
  });

  afterEach(function() {
    moment.tz.setDefault(null);
  });

  var fcMoment, miniCalenderService, $rootScope;

  beforeEach(angular.mock.inject(function(_fcMoment_, _miniCalendarService_, _$rootScope_) {
    fcMoment = _fcMoment_;
    miniCalenderService = _miniCalendarService_;
    $rootScope = _$rootScope_;
  }));

  describe('getWeekAroundDay', function() {

    it('should return the week around a day depending of the miniCalendarConfig', function() {
      function forEachDayInEachPossibleWeek(callback) {
        var start = fcMoment('2015-11-16');
        var nextWeekStart, day, i, j;

        for (i = 0; i < 7; i++) {
          nextWeekStart = fcMoment(start);
          nextWeekStart.add(7, 'days');
          for (j = 0; j < 7; j++) {
            day = fcMoment(start);
            callback(fcMoment(day), fcMoment(start), fcMoment(nextWeekStart));
            day.add(1, 'days');
          }
          start.add(1, 'days');
        }
      }

      //we check that for every fullCalendar.firstDay possible
      //and for each day possible in the week, the computed period is good
      forEachDayInEachPossibleWeek(function(day, startWeek, nextWeekStart) {
        var week = miniCalenderService.getWeekAroundDay({firstDay: startWeek.isoWeekday()}, day);

        expect(startWeek.isSame(week.firstWeekDay, 'day')).to.be.true;
        expect(nextWeekStart.isSame(week.nextFirstWeekDay, 'day')).to.be.true;
      });
    });

  });

  describe('forEachDayOfEvent', function() {

    var event, aDay, spy;

    beforeEach(function() {
      aDay = fcMoment('2015-11-30T11:39:00.376Z');
      event = {start: fcMoment(aDay)};

      spy = sinon.spy(function(day) {
        expect(day.isSame(aDay, 'day')).to.be.true;
        aDay.add(1, 'days');
      });

    });

    it('should iter on each day where the event is present', function() {
      event.end = fcMoment('2015-12-02T11:39:00.376Z');
      miniCalenderService.forEachDayOfEvent(event, spy);
      expect(spy).to.have.been.calledThrice;
    });

    it('should call callback only on start day if no end day', function() {
      miniCalenderService.forEachDayOfEvent(event, spy);
      expect(spy).to.have.been.calledOnce;
    });

    it('should exclude the technical end date for allday events', function() {
      event.start = fcMoment('2015-11-30');
      event.end = fcMoment('2015-12-01');
      event.allDay = true;

      miniCalenderService.forEachDayOfEvent(event, spy);
      expect(spy).to.have.been.calledOnce;
    });
  });

  describe('miniCalendarWrapper', function() {

    var calendar, calWrapper, eventSources, initWrapper, fcMethodMock; // eslint-disable-line

    beforeEach(function() {
      fcMethodMock = {
        addEventSource: sinon.spy(),
        renderEvent: sinon.spy(),
        updateEvent: sinon.spy(),
        removeEvents: sinon.spy(),
        clientEvents: sinon.stub().returns([])
      };
      calendar = {
        fullCalendar: function(name) {
          return fcMethodMock[name].apply(this, Array.prototype.slice.call(arguments, 1));
        }
      };
      eventSources = [];

      initWrapper = function() {
        calWrapper = miniCalenderService.miniCalendarWrapper(calendar, eventSources);
      };
    });

    it('should aggregate event from event sources in a event per day with the number of real event as title', function(done) {
      var start = fcMoment('2015-01-01');
      var end = fcMoment('2015-01-30');
      var timezone = 'tm';

      var sourceEvents = [{
        id: 'a',
        start: fcMoment('2015-01-01T14:31:25.724Z'),
        end: fcMoment('2015-01-01T15:31:25.724Z')
      }, {
        id: 'b',
        start: fcMoment('2015-01-01T17:31:25.724Z'),
        end: fcMoment('2015-01-01T18:31:25.724Z')
      }, {
        id: 'c',
        start: fcMoment('2015-01-01T14:31:25.724Z'),
        end: fcMoment('2015-01-02T15:31:25.724Z')
      }];

      eventSources = [function(_start, _end, _timezone, callback) {
        expect(_start).to.equals(start);
        expect(_end).to.equals(end);
        expect(_timezone).to.equals(timezone);
        callback(sourceEvents);
      }];

      fcMethodMock.addEventSource = function(eventSource) {
        eventSource.events(start, end, timezone, function(fakeEvents) {
          var numFakeEvent = 0;
          var fakeEvent = {};

          fakeEvents.forEach(function(event) {
            expect(event.allDay).to.be.true;
            fakeEvent[event.start] = parseInt(event.title, 10);
            numFakeEvent++;
          });

          expect(fakeEvent['2015-01-01']).to.equals(3);
          expect(fakeEvent['2015-01-02']).to.equals(1);
          expect(numFakeEvent).to.equals(2);
          expect(fcMethodMock.removeEvents).to.have.been.called;
          done();
        });
      };

      fcMethodMock.removeEvents = sinon.spy(angular.noop);

      initWrapper();
      $rootScope.$digest();
    });

    it('should not recount event twice when event source is called twice on the same period', function(done) {
      var start = fcMoment('2015-01-01');
      var end = fcMoment('2015-01-30');
      var timezone = 'who cares';

      var sourceEvents = [{
        id: 'a',
        start: fcMoment('2015-01-01T14:31:25.724Z'),
        end: fcMoment('2015-01-01T15:31:25.724Z')
      }];

      eventSources = [function(_start, _end, _timezone, callback) { // eslint-disable-line
        callback(sourceEvents);
      }];

      fcMethodMock.addEventSource = function(eventSource) {
        var numTest = 0;
        var testEventSource = eventSource.events.bind(null, start, end, timezone, function(fakeEvents) {
          numTest++;
          var numFakeEvent = 0;
          var fakeEvent = {};

          fakeEvents.forEach(function(event) {
            expect(event.allDay).to.be.true;
            fakeEvent[event.start] = parseInt(event.title, 10);
            numFakeEvent++;
          });

          expect(fakeEvent['2015-01-01']).to.equals(1);
          expect(numFakeEvent).to.equals(1);
          (numTest === 2 ? done : testEventSource)();
        });

        testEventSource();
      };

      fcMethodMock.removeEvents = sinon.spy(angular.noop);
      initWrapper();
      $rootScope.$digest();
    });
  });
});
