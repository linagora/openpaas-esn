'use strict';

/* global chai, sinon, _: false */

var expect = chai.expect;

describe('The cachedEventSource service', function() {

  var self = this;

  beforeEach(function() {
    self.originalCallback = sinon.spy();
    self.calendarId = 'a/cal/id';

    self.eventSource = function(start, end, timezone, callback) { // eslint-disable-line
      callback(self.events);
    };
    self.timezone = 'who care';

    angular.mock.module('esn.calendar');

    angular.mock.module(function($provide) {
      $provide.decorator('$timeout', function($delegate) {
        self.$timeout = sinon.spy(function() {
          return $delegate.apply(self, arguments);
        });
        angular.extend(self.$timeout, $delegate);

        return self.$timeout;
      });
    });
  });

  beforeEach(angular.mock.inject(function($rootScope, cachedEventSource, fcMoment) {
    self.cachedEventSource = cachedEventSource;
    self.fcMoment = fcMoment;
    self.events = [{
      id: 1,
      calendarId: self.calendarId,
      uid: 1,
      start: self.fcMoment.utc('1984-01-01 08:00'),
      end: self.fcMoment.utc('1984-01-01 09:00'),
      isRecurring: _.constant(false),
      isInstance: _.constant(false),
      title: 'should not be replaced'
    }, {
      id: 2,
      calendarId: self.calendarId,
      uid: 2,
      start: self.fcMoment.utc('1984-01-02 08:00'),
      end: self.fcMoment.utc('1984-01-02 09:00'),
      isRecurring: _.constant(false),
      isInstance: _.constant(false),
      title: 'to be replaced'
    }];

    self.start = self.fcMoment.utc('1984-01-01').stripTime();
    self.end = self.fcMoment.utc('1984-01-07').stripTime();
    self.$rootScope = $rootScope;
    self.modifiedEvent = {
      id: 2,
      calendarId: self.calendarId,
      title: 'has been replaced',
      start: self.fcMoment('1984-01-03'),
      isInstance: _.constant(false),
      isRecurring: _.constant(false)
    };
  }));

  describe('wrapEventSource method', function() {

    it('should not modify the original event source if no crud event', function() {

      var eventSource = sinon.spy(function(start, end, timezone, callback) {
        expect([start, end, timezone]).to.be.deep.equals([self.start, self.end, self.timezone]);
        callback(self.events);
      });

      self.cachedEventSource.wrapEventSource(self.calendarId, eventSource)(self.start, self.end, self.timezone, self.originalCallback);
      self.$rootScope.$apply();
      expect(self.originalCallback).to.have.been.calledOnce;
      expect(self.originalCallback).to.have.been.calledWithExactly(self.events);
      expect(eventSource).to.have.been.calledOnce;
    });

    it('should ignore element added on other calendar', function() {
      self.modifiedEvent.id = 3;
      self.modifiedEvent.calendarId = 'anOtherCalendar';
      self.cachedEventSource.registerAdd(self.modifiedEvent);
      self.cachedEventSource.wrapEventSource(self.calendarId, self.eventSource)(self.start, self.end, null, self.originalCallback);
      self.$rootScope.$apply();
      expect(self.originalCallback).to.have.been.calledWithExactly(self.events);
    });

    it('should not fetch twice event from the save source', function() {
      var eventSource = sinon.spy(function(start, end, timezone, callback) {
        expect([start, end, timezone]).to.be.deep.equals([self.start, self.end, self.timezone]);
        callback(self.events);
      });

      var wrappedEventSource = self.cachedEventSource.wrapEventSource(self.calendarId, eventSource);

      self.originalCallback = sinon.spy(function(events) {
        expect(_.sortBy(events, 'id')).to.deep.equals(_.sortBy(self.events, 'id'));
      });
      wrappedEventSource(self.start, self.end, self.timezone, self.originalCallback);
      wrappedEventSource(self.start, self.end, self.timezone, self.originalCallback);
      self.$rootScope.$apply();
      expect(eventSource).to.have.been.calledOnce;
      expect(self.originalCallback).to.have.been.calledTwice;
    });

  });

  describe('deleteRegistration function', function() {
    it('should delete all registered crud', function() {
      ['registerAdd', 'registerDelete', 'registerUpdate'].forEach(function(action) {
        self.cachedEventSource[action](self.modifiedEvent);
        self.cachedEventSource.deleteRegistration(self.modifiedEvent);
        self.cachedEventSource.wrapEventSource(self.calendarId, self.eventSource)(self.start, self.end, self.timezone, self.originalCallback);
        self.$rootScope.$apply();
        expect(self.originalCallback).to.have.been.calledWithExactly(self.events);
      }, this);
    });
  });

  describe('register functions', function() {

    it('should not replace event if event that has been crud has been undo by the given callback when crud was registered', function() {
      ['registerAdd', 'registerDelete', 'registerUpdate'].forEach(function(action) {
        var undo = self.cachedEventSource[action](self.modifiedEvent);

        undo();
        self.cachedEventSource.wrapEventSource(self.calendarId, self.eventSource)(self.start, self.end, self.timezone, self.originalCallback);
        self.$rootScope.$apply();
        expect(self.originalCallback).to.have.been.calledWithExactly(self.events);
      }, this);
    });

    describe('registerUpdate function', function() {
      it('should take a event and make wrapped event sources replace event with same id from the original source by this one', function() {
        self.cachedEventSource.registerUpdate(self.modifiedEvent);
        self.cachedEventSource.wrapEventSource(self.calendarId, self.eventSource)(self.start, self.end, self.timezone, self.originalCallback);
        self.$rootScope.$apply();
        expect(self.originalCallback).to.have.been.calledWithExactly([self.events[0], self.modifiedEvent]);
      });

      it('should take an event and make wrapped event sources add this one if it does not exist', function() {
        self.modifiedEvent.id = 3;
        self.cachedEventSource.registerUpdate(self.modifiedEvent);
        self.cachedEventSource.wrapEventSource(self.calendarId, self.eventSource)(self.start, self.end, self.timezone, self.originalCallback);
        self.$rootScope.$apply();
        expect(self.originalCallback).to.have.been.calledWithExactly(self.events.concat(self.modifiedEvent));
      });

      it('should take a recurring event modification that delete an instance and apply it correctly', function() {
        var invariantSubEvent = {
          id: 'subevent',
          uid: 'parent',
          start: self.start.clone().add(1, 'hour'),
          end: self.end.clone().subtract(1, 'hour'),
          isInstance: _.constant(true),
          isRecurring: _.constant(false)
        };

        var deletedSubEvent = {
          id: 'invalid subevent',
          uid: 'parent',
          start: self.start.clone().add(1, 'hour'),
          end: self.end.clone().subtract(1, 'hour'),
          isInstance: _.constant(true),
          isRecurring: _.constant(false)
        };

        self.modifiedEvent.id = 'parent';
        self.modifiedEvent.isRecurring = sinon.stub().returns(true);
        self.modifiedEvent.expand = sinon.stub().returns([invariantSubEvent]);
        self.events.push(invariantSubEvent);
        self.events.push(deletedSubEvent);

        self.cachedEventSource.registerUpdate(self.modifiedEvent);
        self.cachedEventSource.wrapEventSource(self.calendarId, self.eventSource)(self.start, self.end, self.timezone, self.originalCallback);
        self.$rootScope.$apply();

        expect(self.modifiedEvent.isRecurring).to.have.been.called;
        expect(self.modifiedEvent.expand).to.have.been.calledWith(self.start.clone().subtract(1, 'day'), self.end.clone().add(1, 'day'));

        expect(self.originalCallback).to.have.been.calledWithExactly(self.events.slice(0, self.events.length - 1));
      });

      it('should take a recurring event modification that modify an instance and apply it correctly', function() {
        var invariantSubEvent = {
          id: 'subevent',
          uid: 'parent',
          start: self.start.clone().add(1, 'hour'),
          end: self.end.clone().subtract(1, 'hour'),
          isInstance: _.constant(true),
          isRecurring: _.constant(false)
        };

        var modifiedSubInstanceBefore = {
          id: 'invalid subevent',
          uid: 'parent',
          start: self.start.clone().add(1, 'hour'),
          end: self.end.clone().subtract(1, 'hour'),
          isInstance: _.constant(true),
          isRecurring: _.constant(false)
        };

        var modifiedSubInstanceAfter = _.clone(modifiedSubInstanceBefore);

        modifiedSubInstanceAfter.title = 'Modified';

        self.modifiedEvent.id = 'parent';
        self.modifiedEvent.isRecurring = sinon.stub().returns(true);
        self.modifiedEvent.expand = sinon.stub().returns([invariantSubEvent, modifiedSubInstanceAfter]);
        self.events.push(invariantSubEvent);
        self.events.push(modifiedSubInstanceBefore);

        self.cachedEventSource.registerUpdate(self.modifiedEvent);
        self.cachedEventSource.wrapEventSource(self.calendarId, self.eventSource)(self.start, self.end, self.timezone, self.originalCallback);
        self.$rootScope.$apply();

        expect(self.modifiedEvent.isRecurring).to.have.been.called;
        expect(self.modifiedEvent.expand).to.have.been.calledWith(self.start.clone().subtract(1, 'day'), self.end.clone().add(1, 'day'));

        expect(self.originalCallback).to.have.been.calledWithExactly(self.events.slice(0, self.events.length - 1).concat(modifiedSubInstanceAfter));
      });

      it('should replace previous modification by new modification on recurring event', function() {
        var event1Before = {
          id: 'subevent',
          calendarId: self.calendarId,
          uid: 'parent',
          start: self.start.clone().add(1, 'hour'),
          end: self.end.clone().subtract(1, 'hour'),
          isInstance: _.constant(true),
          isRecurring: _.constant(false)
        };

        var event2 = {
          id: 'subevent 2',
          calendarId: self.calendarId,
          uid: 'parent',
          start: self.start.clone().add(1, 'hour'),
          end: self.end.clone().subtract(1, 'hour'),
          isInstance: _.constant(true),
          isRecurring: _.constant(false)
        };

        var event1After = _.clone(event1Before);

        event1After.title = 'after';

        self.modifiedEvent.id = 'parent';
        self.modifiedEvent.expand = sinon.stub().returns([event1Before, event2]);
        self.modifiedEvent.isRecurring = sinon.stub().returns(true);
        self.events = [];

        var wrapedEventSource = self.cachedEventSource.wrapEventSource(self.calendarId, self.eventSource);

        self.cachedEventSource.registerUpdate(self.modifiedEvent);
        wrapedEventSource(self.start, self.end, self.timezone, self.originalCallback);
        self.$rootScope.$apply();

        expect(self.modifiedEvent.isRecurring).to.have.been.called;
        expect(self.modifiedEvent.expand).to.have.been.calledWith(self.start.clone().subtract(1, 'day'), self.end.clone().add(1, 'day'));
        expect(self.originalCallback).to.have.been.calledWithExactly([event1Before, event2]);

        self.modifiedEvent.expand = sinon.stub().returns([event1After]);
        self.cachedEventSource.registerUpdate(self.modifiedEvent);
        wrapedEventSource(self.start, self.end, self.timezone, self.originalCallback);
        self.$rootScope.$apply();

        expect(self.modifiedEvent.isRecurring).to.have.been.called;
        expect(self.modifiedEvent.expand).to.have.been.calledWith(self.start.clone().subtract(1, 'day'), self.end.clone().add(1, 'day'));
        expect(self.originalCallback).to.have.been.calledWithExactly([event1After]);
      });

      it('should take a recurring event and make wrapped event sources add this one if it does not exist', function() {
        var correctSubEvent = {
          id: 'subevent',
          calendarId: self.calendarId,
          start: self.start.clone().add(1, 'hour'),
          end: self.end.clone().subtract(1, 'hour'),
          isRecurring: _.constant(false)
        };

        var invalidSubEvent = {
          id: 'invalid subevent',
          calendarId: self.calendarId,
          start: self.start.clone().subtract(2, 'days'),
          end: self.start.clone().subtract(1, 'hour'),
          isRecurring: _.constant(false)
        };

        self.modifiedEvent.id = 'parent';
        self.modifiedEvent.isRecurring = sinon.stub().returns(true);
        self.modifiedEvent.expand = sinon.stub().returns([correctSubEvent, invalidSubEvent]);

        self.cachedEventSource.registerUpdate(self.modifiedEvent);
        self.cachedEventSource.wrapEventSource(self.calendarId, self.eventSource)(self.start, self.end, self.timezone, self.originalCallback);
        self.$rootScope.$apply();

        expect(self.modifiedEvent.isRecurring).to.have.been.called;
        expect(self.modifiedEvent.expand).to.have.been.calledWith(self.start.clone().subtract(1, 'day'), self.end.clone().add(1, 'day'));

        expect(self.originalCallback).to.have.been.calledWithExactly(self.events.concat(correctSubEvent));
      });

      it('should correctly reexpand an event if it was not expanded in this full period the first time', function() {
        var aDate = self.fcMoment([2017, 11, 8, 21, 0]);

        var inFirstPeriod = {
          id: '1',
          calendarId: self.calendarId,
          start: aDate.clone().subtract(2, 'days'),
          end: aDate.clone().subtract(2, 'days'),
          isRecurring: _.constant(false),
          _period: [aDate.clone().subtract(7, 'day'), aDate.clone()]
        };

        var inSecondPeriod = {
          id: '2',
          calendarId: self.calendarId,
          start: aDate.clone().add(2, 'days'),
          end: aDate.clone().add(2, 'days'),
          isRecurring: _.constant(false),
          _period: [aDate.clone(), aDate.clone().add(7, 'day')]
        };

        var inThirdPeriod = {
          id: '3',
          calendarId: self.calendarId,
          start: aDate.clone().add(9, 'days'),
          end: aDate.clone().add(9, 'days'),
          isRecurring: _.constant(false),
          _period: [aDate.clone().add(7, 'day'), aDate.clone().add(14, 'day')]
        };

        self.events = [];
        self.modifiedEvent.id = 'parent';
        self.modifiedEvent.isRecurring = sinon.stub().returns(true);
        self.modifiedEvent.expand = sinon.spy(function(start, end) {
          var result = [];

          [inFirstPeriod, inSecondPeriod, inThirdPeriod].forEach(function(event) {
            if (event.start.isBefore(end) && event.start.isAfter(start)) {
              result.push(event);
            }
          });

          return result;
        });

        //meta-testing start (powa)
        expect(self.modifiedEvent.expand(inFirstPeriod._period[0], inFirstPeriod._period[1])).to.deep.equals([inFirstPeriod]);
        expect(self.modifiedEvent.expand(inSecondPeriod._period[0], inThirdPeriod._period[1])).to.deep.equals([inSecondPeriod, inThirdPeriod]);
        expect(self.modifiedEvent.expand(inFirstPeriod._period[0], inThirdPeriod._period[1])).to.deep.equals([inFirstPeriod, inSecondPeriod, inThirdPeriod]);
        //meta-testing end

        self.cachedEventSource.registerUpdate(self.modifiedEvent);

        self.cachedEventSource.wrapEventSource(self.calendarId, self.eventSource)(inSecondPeriod._period[0], inSecondPeriod._period[1], self.timezone, self.originalCallback);
        self.$rootScope.$apply();
        expect(self.originalCallback.firstCall).to.have.been.calledWithExactly([inSecondPeriod]);

        self.cachedEventSource.wrapEventSource(self.calendarId, self.eventSource)(inSecondPeriod._period[0], inThirdPeriod._period[1], self.timezone, self.originalCallback);
        self.$rootScope.$apply();
        expect(self.originalCallback.secondCall).to.have.been.calledWithExactly([inSecondPeriod, inThirdPeriod]);

        self.cachedEventSource.wrapEventSource(self.calendarId, self.eventSource)(inFirstPeriod._period[0], inThirdPeriod._period[1], self.timezone, self.originalCallback);
        self.$rootScope.$apply();
        expect(self.originalCallback.thirdCall).to.have.been.calledWithExactly([inFirstPeriod, inSecondPeriod, inThirdPeriod]);
      });
    });

    describe('registerDelete function', function() {
      it('should take a event and make wrapped event sources delete event with same id from the original source', function() {
        self.cachedEventSource.registerDelete(self.modifiedEvent);
        self.cachedEventSource.wrapEventSource(self.calendarId, self.eventSource)(self.start, self.end, self.timezone, self.originalCallback);
        self.$rootScope.$apply();
        expect(self.originalCallback).to.have.been.calledWithExactly([self.events[0]]);
      });
    });

    describe('registerAdd function', function() {

      it('should take a event and make wrapped event sources add this event if it is in the requested period and one the same calendar', function() {
        self.modifiedEvent.id = 3;
        self.cachedEventSource.registerAdd(self.modifiedEvent);
        self.cachedEventSource.wrapEventSource(self.calendarId, self.eventSource)(self.start, self.end, null, self.originalCallback);
        self.$rootScope.$apply();
        expect(self.originalCallback).to.have.been.calledWithExactly(self.events.concat(self.modifiedEvent));
      });

      it('should take a event and make wrapped event sources add this event end even if only it\'s end is in the requested period', function() {
        self.modifiedEvent.id = 3;
        self.modifiedEvent.start = self.fcMoment('1984-01-06 10:00');
        self.modifiedEvent.end = self.fcMoment('1984-01-07 01:00');
        self.cachedEventSource.registerAdd(self.modifiedEvent);
        self.cachedEventSource.wrapEventSource(self.calendarId, self.eventSource)(self.start, self.end, null, self.originalCallback);
        self.$rootScope.$apply();
        expect(self.originalCallback).to.have.been.calledWithExactly(self.events.concat(self.modifiedEvent));
      });

      it('should take a event and make wrapped event sources add this event end even if only it\'s start is in the requested period', function() {
        self.modifiedEvent.id = 3;
        self.modifiedEvent.start = self.fcMoment('1984-01-07 23:59');
        self.modifiedEvent.end = self.fcMoment('1984-01-08 00:45');
        self.cachedEventSource.registerAdd(self.modifiedEvent);
        self.cachedEventSource.wrapEventSource(self.calendarId, self.eventSource)(self.start, self.end, null, self.originalCallback);
        self.$rootScope.$apply();
        expect(self.originalCallback).to.have.been.calledWithExactly(self.events.concat(self.modifiedEvent));
      });

      it('should take a recurring event and make wrapped event sources expand it and add his subevent in the requested period', function() {
        var correctSubEvent = {
          id: 'subevent',
          calendarId: self.calendarId,
          start: self.start.clone().add(1, 'hour'),
          end: self.end.clone().subtract(1, 'hour'),
          isRecurring: _.constant(false)
        };

        var invalidSubEvent = {
          id: 'invalid subevent',
          calendarId: self.calendarId,
          start: self.start.clone().subtract(2, 'days'),
          end: self.start.clone().subtract(1, 'hour'),
          isRecurring: _.constant(false)
        };

        self.modifiedEvent.id = 'parent';
        self.modifiedEvent.isRecurring = sinon.stub().returns(true);
        self.modifiedEvent.expand = sinon.stub().returns([correctSubEvent, invalidSubEvent]);
        self.cachedEventSource.registerAdd(self.modifiedEvent);
        self.cachedEventSource.wrapEventSource(self.calendarId, self.eventSource)(self.start, self.end, null, self.originalCallback);
        self.$rootScope.$apply();
        expect(self.modifiedEvent.isRecurring).to.have.been.called;
        expect(self.modifiedEvent.expand).to.have.been.calledWith(self.start.clone().subtract(1, 'day'), self.end.clone().add(1, 'day'));
        expect(self.originalCallback).to.have.been.calledWithExactly(self.events.concat(correctSubEvent));
      });

      it('should ignore a event if it is not on the same calendar even if it is in the requested period', function() {
        self.modifiedEvent.id = 3;
        self.modifiedEvent.calendarId = 'this_is_an_other_id';
        self.cachedEventSource.registerAdd(self.modifiedEvent);
        self.cachedEventSource.wrapEventSource(self.calendarId, self.eventSource)(self.start, self.end, null, self.originalCallback);
        self.$rootScope.$apply();
        expect(self.originalCallback).to.have.been.calledWithExactly(self.events);
      });

      it('should ignore a event that end before the first day of the requested period', function() {
        self.modifiedEvent.id = 3;
        self.modifiedEvent.start = self.fcMoment('1983-31-31 10:00');
        self.modifiedEvent.end = self.fcMoment('1983-31-31 23:00');
        self.cachedEventSource.registerAdd(self.modifiedEvent);
        self.cachedEventSource.wrapEventSource(self.calendarId, self.eventSource)(self.start, self.end, null, self.originalCallback);
        self.$rootScope.$apply();
        expect(self.originalCallback).to.have.been.calledWithExactly(self.events);
      });

      it('should ignore a event that start after the last day of the requested period', function() {
        self.modifiedEvent.id = 3;
        self.modifiedEvent.start = self.fcMoment('1984-01-08 00:30');
        self.modifiedEvent.end = self.fcMoment('1984-01-08 00:45');
        self.cachedEventSource.registerAdd(self.modifiedEvent);
        self.cachedEventSource.wrapEventSource(self.calendarId, self.eventSource)(self.start, self.end, null, self.originalCallback);
        self.$rootScope.$apply();
        expect(self.originalCallback).to.have.been.calledWithExactly(self.events);
      });
    });

  });
});
