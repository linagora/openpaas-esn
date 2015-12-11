'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The mini-calendar service', function() {

  beforeEach(function() {
    angular.mock.module('esn.calendar', 'linagora.esn.graceperiod');
    moment.tz.setDefault('Europe/Paris'); // jshint ignore:line
  });

  var fcMoment, miniCalenderLogic, $rootScope;
  beforeEach(angular.mock.inject(function(_fcMoment_, _miniCalendarLogic_, _$rootScope_) {
    fcMoment = _fcMoment_;
    miniCalenderLogic = _miniCalendarLogic_;
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
        var week = miniCalenderLogic.getWeekAroundDay({firstDay: startWeek.isoWeekday()}, day);
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
      miniCalenderLogic.forEachDayOfEvent(event, spy);
      expect(spy).to.have.been.calledThrice;
    });

    it('should call callback only on start day if no end day', function() {
      miniCalenderLogic.forEachDayOfEvent(event, spy);
      expect(spy).to.have.been.calledOnce;
    });
    it('should exclude the technical end date for allday events', function() {
      event.start = fcMoment('2015-11-30');
      event.end = fcMoment('2015-12-01');
      event.allDay = true;

      miniCalenderLogic.forEachDayOfEvent(event, spy);
      expect(spy).to.have.been.calledOnce;
    });
  });

  describe('miniCalendarWrapper', function() {

    var calendar, calWrapper, eventSources, initWrapper, fcMethodMock, fcEvent;
    beforeEach(function() {
      fcMethodMock = {
        addEventSource: angular.noop,
        renderEvent: angular.noop,
        updateEvent: angular.noop,
        clientEvents: function() { return []; }
      };
      calendar = {
        fullCalendar: function(name) {
          return fcMethodMock[name].apply(this, Array.prototype.slice.call(arguments, 1));
        }
      };

      eventSources = [];

      initWrapper = function() {
        calWrapper = miniCalenderLogic.miniCalendarWrapper(calendar, eventSources);
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

    describe('addEvent function', function() {

      it('should update fake event title when adding a real event', function() {
        var date = '2015-01-02';
        var fcEvent = {id: date, _fromFc: true};
        var time = 1;

        fcMethodMock.clientEvents = sinon.spy(function(id) {
          expect(id).to.equals(date);
          return [fcEvent];
        });

        function sendEvent(time) {
          calWrapper.addEvent({
            id: 'anId' + time,
            start: fcMoment(date)
          });
        }

        fcMethodMock.updateEvent = sinon.spy(function(event) {
          expect(event).to.equals(fcEvent);
          expect(parseInt(event.title, 10)).to.equals(time);
          expect(fcMethodMock.clientEvents).to.be.called;
        });

        initWrapper();
        sendEvent(time);
        time++;
        sendEvent(time);
        expect(fcMethodMock.updateEvent).to.have.been.calledTwice;
      });

      it('should add fake day event if not already one when adding a real event', function() {
        var date = '2015-01-02';

        fcMethodMock.clientEvents = sinon.spy(function(id) {
          expect(id).to.equals(date);
          return [];
        });

        fcMethodMock.renderEvent = sinon.spy(function(event) {
          expect(parseInt(event.title, 10)).to.equals(1);
        });

        initWrapper();
        calWrapper.addEvent({
          id: 'anId',
          start: fcMoment(date)
        });

        expect(fcMethodMock.renderEvent).to.have.been.calledOnce;
        expect(fcMethodMock.clientEvents).to.be.called;
      });
    });

    describe('removeEvent function', function() {

      it('should delete fake day event when real event is removed and there is no more event this day', function() {
        var date = '2015-01-02';
        fcEvent = {id: date, _fromFc: true};
        initWrapper();
        calWrapper.addEvent({id: 'anId', start: fcMoment(date)});

        fcMethodMock.clientEvents = sinon.spy(function(id) {
          expect(id).to.equals(date);
          return [fcEvent];
        });

        fcMethodMock.removeEvents = sinon.spy(function(id) {
          expect(id).to.equals(date);
          expect(fcMethodMock.clientEvents).to.be.called;
        });

        calWrapper.removeEvent('anId');

        expect(fcMethodMock.removeEvents).to.have.been.calledOnce;
      });

      it('should update fake day event when real event is removed and still some event on this day', function() {
        var date = '2015-01-02';
        initWrapper();
        calWrapper.addEvent({id: 'anId1', start: fcMoment(date)});
        calWrapper.addEvent({id: 'anId2', start: fcMoment(date)});

        fcMethodMock.clientEvents = function(id) {
          return [{id: date}];
        };

        var fcEvent = {id: date, _fromFc: true};

        fcMethodMock.clientEvents = sinon.spy(function(id) {
          expect(id).to.equals(date);
          return [fcEvent];
        });

        fcMethodMock.updateEvent = sinon.spy(function(event) {
          expect(event).to.equals(fcEvent);
          expect(parseInt(event.title, 10)).to.equals(1);
        });

        calWrapper.removeEvent('anId1');
        expect(fcMethodMock.clientEvents).to.be.calledOnce;
        expect(fcMethodMock.updateEvent).to.be.calledOnce;
      });
    });

    describe('modifyEvent', function() {
      it('should update fake event when a real event is modify', function() {
        var date = '2015-01-02';
        var newDate = '2015-01-03';

        initWrapper();
        calWrapper.addEvent({id: 'anId', start: fcMoment(date)});

        fcMethodMock.clientEvents = function(id) {
          return [{id: date}];
        };

        fcMethodMock.clientEvents = sinon.spy(function(id) {
          if (id === newDate) {
            return [];
          } else if (id === date) {
            return {id: date};
          } else {
            throw 'Unexpected id : ' + id;
          }
        });

        fcMethodMock.removeEvents = sinon.spy(function(id) {
          expect(id).to.equals(date);
        });

        fcMethodMock.renderEvent = sinon.spy(function(event) {
          expect(event.id).to.equals(newDate);
          expect(parseInt(event.title, 10)).to.equals(1);
        });

        calWrapper.modifyEvent({id: 'anId', start: fcMoment(newDate)});

        expect(fcMethodMock.removeEvents).to.have.been.called;
        expect(fcMethodMock.renderEvent).to.have.been.called;
      });
    });
  });
});
