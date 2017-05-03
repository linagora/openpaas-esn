'use strict';

/* global chai, sinon, _: false */

var expect = chai.expect;

describe('The calCachedEventSource service', function() {

  var self = this;

  beforeEach(function() {
    self.originalCallback = sinon.spy();
    self.calendarUniqueId = 'a/cal/id';

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

  beforeEach(angular.mock.inject(function($rootScope, calCachedEventSource, calMoment) {
    self.calCachedEventSource = calCachedEventSource;
    self.calMoment = calMoment;
    self.events = [{
      id: 1,
      calendarUniqueId: self.calendarUniqueId,
      uid: 1,
      start: self.calMoment.utc('1984-01-01 08:00'),
      end: self.calMoment.utc('1984-01-01 09:00'),
      isRecurring: _.constant(false),
      isInstance: _.constant(false),
      title: 'should not be replaced'
    }, {
      id: 2,
      calendarUniqueId: self.calendarUniqueId,
      uid: 2,
      start: self.calMoment.utc('1984-01-02 08:00'),
      end: self.calMoment.utc('1984-01-02 09:00'),
      isRecurring: _.constant(false),
      isInstance: _.constant(false),
      title: 'to be replaced'
    }];

    self.start = self.calMoment.utc('1984-01-01').stripTime();
    self.end = self.calMoment.utc('1984-01-07').stripTime();
    self.$rootScope = $rootScope;
    self.modifiedEvent = {
      id: 2,
      calendarUniqueId: self.calendarUniqueId,
      title: 'has been replaced',
      start: self.calMoment('1984-01-03'),
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

      self.calCachedEventSource.wrapEventSource(self.calendarUniqueId, eventSource)(self.start, self.end, self.timezone, self.originalCallback);
      self.$rootScope.$apply();
      expect(self.originalCallback).to.have.been.calledOnce;
      expect(self.originalCallback).to.have.been.calledWithExactly(self.events);
      expect(eventSource).to.have.been.calledOnce;
    });

    it('should ignore element added on other calendar', function() {
      self.modifiedEvent.id = 3;
      self.modifiedEvent.calendarUniqueId = 'anOtherCalendar';
      self.calCachedEventSource.registerAdd(self.modifiedEvent);
      self.calCachedEventSource.wrapEventSource(self.calendarUniqueId, self.eventSource)(self.start, self.end, null, self.originalCallback);
      self.$rootScope.$apply();
      expect(self.originalCallback).to.have.been.calledWithExactly(self.events);
    });

    it('should not fetch twice event from the save source', function() {
      var eventSource = sinon.spy(function(start, end, timezone, callback) {
        expect([start, end, timezone]).to.be.deep.equals([self.start, self.end, self.timezone]);
        callback(self.events);
      });

      var wrappedEventSource = self.calCachedEventSource.wrapEventSource(self.calendarUniqueId, eventSource);

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
        self.calCachedEventSource[action](self.modifiedEvent);
        self.calCachedEventSource.deleteRegistration(self.modifiedEvent);
        self.calCachedEventSource.wrapEventSource(self.calendarUniqueId, self.eventSource)(self.start, self.end, self.timezone, self.originalCallback);
        self.$rootScope.$apply();
        expect(self.originalCallback).to.have.been.calledWithExactly(self.events);
      }, this);
    });
  });

  describe('register functions', function() {

    it('should not replace event if event that has been crud has been undo by the given callback when crud was registered', function() {
      ['registerAdd', 'registerDelete', 'registerUpdate'].forEach(function(action) {
        var undo = self.calCachedEventSource[action](self.modifiedEvent);

        undo();
        self.calCachedEventSource.wrapEventSource(self.calendarUniqueId, self.eventSource)(self.start, self.end, self.timezone, self.originalCallback);
        self.$rootScope.$apply();
        expect(self.originalCallback).to.have.been.calledWithExactly(self.events);
      }, this);
    });

    describe('registerUpdate function', function() {
      it('should take a event and make wrapped event sources replace event with same id from the original source by this one', function() {
        self.calCachedEventSource.registerUpdate(self.modifiedEvent);
        self.calCachedEventSource.wrapEventSource(self.calendarUniqueId, self.eventSource)(self.start, self.end, self.timezone, self.originalCallback);
        self.$rootScope.$apply();
        expect(self.originalCallback).to.have.been.calledWithExactly([self.events[0], self.modifiedEvent]);
      });

      it('should take an event and make wrapped event sources add this one if it does not exist', function() {
        self.modifiedEvent.id = 3;
        self.calCachedEventSource.registerUpdate(self.modifiedEvent);
        self.calCachedEventSource.wrapEventSource(self.calendarUniqueId, self.eventSource)(self.start, self.end, self.timezone, self.originalCallback);
        self.$rootScope.$apply();
        expect(self.originalCallback).to.have.been.calledWithExactly(self.events.concat(self.modifiedEvent));
      });

      it('should take a modification that transform a normal event in a recurring event and apply it correctly', function() {

        var subEvent = {
          id: 'subevent',
          uid: self.modifiedEvent.id,
          start: self.start.clone().add(1, 'hour'),
          calendarUniqueId: self.calendarUniqueId,
          end: self.end.clone().subtract(1, 'hour'),
          isInstance: _.constant(true),
          isRecurring: _.constant(false)
        };

        self.modifiedEvent.isRecurring = sinon.stub().returns(true);
        self.modifiedEvent.expand = sinon.stub().returns([subEvent]);

        self.calCachedEventSource.registerUpdate(self.modifiedEvent);
        self.calCachedEventSource.wrapEventSource(self.calendarUniqueId, self.eventSource)(self.start, self.end, self.timezone, self.originalCallback);
        self.$rootScope.$apply();

        expect(self.modifiedEvent.isRecurring).to.have.been.called;
        expect(self.modifiedEvent.expand).to.have.been.calledWith(self.start.clone().subtract(1, 'day'), self.end.clone().add(1, 'day'));
        expect(self.originalCallback).to.have.been.calledWithExactly(self.events.slice(0, self.events.length - 1).concat([subEvent]));
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

        self.calCachedEventSource.registerUpdate(self.modifiedEvent);
        self.calCachedEventSource.wrapEventSource(self.calendarUniqueId, self.eventSource)(self.start, self.end, self.timezone, self.originalCallback);
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

        self.calCachedEventSource.registerUpdate(self.modifiedEvent);
        self.calCachedEventSource.wrapEventSource(self.calendarUniqueId, self.eventSource)(self.start, self.end, self.timezone, self.originalCallback);
        self.$rootScope.$apply();

        expect(self.modifiedEvent.isRecurring).to.have.been.called;
        expect(self.modifiedEvent.expand).to.have.been.calledWith(self.start.clone().subtract(1, 'day'), self.end.clone().add(1, 'day'));

        expect(self.originalCallback).to.have.been.calledWithExactly(self.events.slice(0, self.events.length - 1).concat(modifiedSubInstanceAfter));
      });

      it('should replace previous modification by new modification on recurring event', function() {
        var event1Before = {
          id: 'subevent',
          calendarUniqueId: self.calendarUniqueId,
          uid: 'parent',
          start: self.start.clone().add(1, 'hour'),
          end: self.end.clone().subtract(1, 'hour'),
          isInstance: _.constant(true),
          isRecurring: _.constant(false)
        };

        var event2 = {
          id: 'subevent 2',
          calendarUniqueId: self.calendarUniqueId,
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

        var wrapedEventSource = self.calCachedEventSource.wrapEventSource(self.calendarUniqueId, self.eventSource);

        self.calCachedEventSource.registerUpdate(self.modifiedEvent);
        wrapedEventSource(self.start, self.end, self.timezone, self.originalCallback);
        self.$rootScope.$apply();

        expect(self.modifiedEvent.isRecurring).to.have.been.called;
        expect(self.modifiedEvent.expand).to.have.been.calledWith(self.start.clone().subtract(1, 'day'), self.end.clone().add(1, 'day'));
        expect(self.originalCallback).to.have.been.calledWithExactly([event1Before, event2]);

        self.modifiedEvent.expand = sinon.stub().returns([event1After]);
        self.calCachedEventSource.registerUpdate(self.modifiedEvent);
        wrapedEventSource(self.start, self.end, self.timezone, self.originalCallback);
        self.$rootScope.$apply();

        expect(self.modifiedEvent.isRecurring).to.have.been.called;
        expect(self.modifiedEvent.expand).to.have.been.calledWith(self.start.clone().subtract(1, 'day'), self.end.clone().add(1, 'day'));
        expect(self.originalCallback).to.have.been.calledWithExactly([event1After]);
      });

      it('should take a recurring event and make wrapped event sources add this one if it does not exist', function() {
        var correctSubEvent = {
          id: 'subevent',
          calendarUniqueId: self.calendarUniqueId,
          start: self.start.clone().add(1, 'hour'),
          end: self.end.clone().subtract(1, 'hour'),
          isRecurring: _.constant(false)
        };

        var invalidSubEvent = {
          id: 'invalid subevent',
          calendarUniqueId: self.calendarUniqueId,
          start: self.start.clone().subtract(2, 'days'),
          end: self.start.clone().subtract(1, 'hour'),
          isRecurring: _.constant(false)
        };

        self.modifiedEvent.id = 'parent';
        self.modifiedEvent.isRecurring = sinon.stub().returns(true);
        self.modifiedEvent.expand = sinon.stub().returns([correctSubEvent, invalidSubEvent]);

        self.calCachedEventSource.registerUpdate(self.modifiedEvent);
        self.calCachedEventSource.wrapEventSource(self.calendarUniqueId, self.eventSource)(self.start, self.end, self.timezone, self.originalCallback);
        self.$rootScope.$apply();

        expect(self.modifiedEvent.isRecurring).to.have.been.called;
        expect(self.modifiedEvent.expand).to.have.been.calledWith(self.start.clone().subtract(1, 'day'), self.end.clone().add(1, 'day'));

        expect(self.originalCallback).to.have.been.calledWithExactly(self.events.concat(correctSubEvent));
      });

      it('should correctly reexpand an event if it was not expanded in this full period the first time and if it was a modification of a event that was not a recurring before', function() {
        var aDate = self.start.clone().add(3, 'days');

        var inFirstPeriod = {
          id: '1',
          calendarUniqueId: self.calendarUniqueId,
          start: aDate.clone().subtract(2, 'days'),
          end: aDate.clone().subtract(2, 'days'),
          isRecurring: _.constant(false),
          _period: [aDate.clone().subtract(4, 'day'), aDate.clone()]
        };

        var inSecondPeriod = {
          id: '2_2',
          calendarUniqueId: self.calendarUniqueId,
          start: aDate.clone().add(2, 'days'),
          end: aDate.clone().add(2, 'days'),
          isRecurring: _.constant(false),
          _period: [aDate.clone(), aDate.clone().add(7, 'day')]
        };

        var inThirdPeriod = {
          id: '2_3',
          calendarUniqueId: self.calendarUniqueId,
          start: aDate.clone().add(9, 'days'),
          end: aDate.clone().add(9, 'days'),
          isRecurring: _.constant(false),
          _period: [aDate.clone().add(7, 'day'), aDate.clone().add(14, 'day')]
        };

        self.events = [self.events[1]];
        self.modifiedEvent.id = 2;
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

        var wrapEventSource = self.calCachedEventSource.wrapEventSource(self.calendarUniqueId, self.eventSource);

        self.calCachedEventSource.registerUpdate(self.modifiedEvent);

        wrapEventSource(inSecondPeriod._period[0], inSecondPeriod._period[1], self.timezone, self.originalCallback);
        self.$rootScope.$apply();
        expect(self.originalCallback.firstCall).to.have.been.calledWithExactly([inSecondPeriod]);

        wrapEventSource(inSecondPeriod._period[0], inThirdPeriod._period[1], self.timezone, self.originalCallback);
        self.$rootScope.$apply();
        expect(self.originalCallback.secondCall).to.have.been.calledWithExactly([inSecondPeriod, inThirdPeriod]);

        wrapEventSource(inFirstPeriod._period[0], inThirdPeriod._period[1], self.timezone, self.originalCallback);
        self.$rootScope.$apply();
        expect(self.originalCallback.thirdCall).to.have.been.calledWithExactly([inFirstPeriod, inSecondPeriod, inThirdPeriod]);
      });

      it('should correctly reexpand an event if it was not expanded in this full period the first time', function() {
        var aDate = self.calMoment([2017, 11, 8, 21, 0]);

        var inFirstPeriod = {
          id: '1',
          calendarUniqueId: self.calendarUniqueId,
          start: aDate.clone().subtract(2, 'days'),
          end: aDate.clone().subtract(2, 'days'),
          isRecurring: _.constant(false),
          _period: [aDate.clone().subtract(7, 'day'), aDate.clone()]
        };

        var inSecondPeriod = {
          id: '2',
          calendarUniqueId: self.calendarUniqueId,
          start: aDate.clone().add(2, 'days'),
          end: aDate.clone().add(2, 'days'),
          isRecurring: _.constant(false),
          _period: [aDate.clone(), aDate.clone().add(7, 'day')]
        };

        var inThirdPeriod = {
          id: '3',
          calendarUniqueId: self.calendarUniqueId,
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

        self.calCachedEventSource.registerUpdate(self.modifiedEvent);

        self.calCachedEventSource.wrapEventSource(self.calendarUniqueId, self.eventSource)(inSecondPeriod._period[0], inSecondPeriod._period[1], self.timezone, self.originalCallback);
        self.$rootScope.$apply();
        expect(self.originalCallback.firstCall).to.have.been.calledWithExactly([inSecondPeriod]);

        self.calCachedEventSource.wrapEventSource(self.calendarUniqueId, self.eventSource)(inSecondPeriod._period[0], inThirdPeriod._period[1], self.timezone, self.originalCallback);
        self.$rootScope.$apply();
        expect(self.originalCallback.secondCall).to.have.been.calledWithExactly([inSecondPeriod, inThirdPeriod]);

        self.calCachedEventSource.wrapEventSource(self.calendarUniqueId, self.eventSource)(inFirstPeriod._period[0], inThirdPeriod._period[1], self.timezone, self.originalCallback);
        self.$rootScope.$apply();
        expect(self.originalCallback.thirdCall).to.have.been.calledWithExactly([inFirstPeriod, inSecondPeriod, inThirdPeriod]);
      });
    });

    describe('registerDelete function', function() {
      it('should take a event and make wrapped event sources delete event with same id from the original source', function() {
        self.calCachedEventSource.registerDelete(self.modifiedEvent);
        self.calCachedEventSource.wrapEventSource(self.calendarUniqueId, self.eventSource)(self.start, self.end, self.timezone, self.originalCallback);
        self.$rootScope.$apply();
        expect(self.originalCallback).to.have.been.calledWithExactly([self.events[0]]);
      });
    });

    describe('registerAdd function', function() {

      it('should take a event and make wrapped event sources add this event if it is in the requested period and one the same calendar', function() {
        self.modifiedEvent.id = 3;
        self.calCachedEventSource.registerAdd(self.modifiedEvent);
        self.calCachedEventSource.wrapEventSource(self.calendarUniqueId, self.eventSource)(self.start, self.end, null, self.originalCallback);
        self.$rootScope.$apply();
        expect(self.originalCallback).to.have.been.calledWithExactly(self.events.concat(self.modifiedEvent));
      });

      it('should take a event and make wrapped event sources add this event end even if only it\'s end is in the requested period', function() {
        self.modifiedEvent.id = 3;
        self.modifiedEvent.start = self.calMoment('1984-01-06 10:00');
        self.modifiedEvent.end = self.calMoment('1984-01-07 01:00');
        self.calCachedEventSource.registerAdd(self.modifiedEvent);
        self.calCachedEventSource.wrapEventSource(self.calendarUniqueId, self.eventSource)(self.start, self.end, null, self.originalCallback);
        self.$rootScope.$apply();
        expect(self.originalCallback).to.have.been.calledWithExactly(self.events.concat(self.modifiedEvent));
      });

      it('should take a event and make wrapped event sources add this event end even if only it\'s start is in the requested period', function() {
        self.modifiedEvent.id = 3;
        self.modifiedEvent.start = self.calMoment('1984-01-07 23:59');
        self.modifiedEvent.end = self.calMoment('1984-01-08 00:45');
        self.calCachedEventSource.registerAdd(self.modifiedEvent);
        self.calCachedEventSource.wrapEventSource(self.calendarUniqueId, self.eventSource)(self.start, self.end, null, self.originalCallback);
        self.$rootScope.$apply();
        expect(self.originalCallback).to.have.been.calledWithExactly(self.events.concat(self.modifiedEvent));
      });

      it('should take a recurring event and make wrapped event sources expand it and add his subevent in the requested period', function() {
        var correctSubEvent = {
          id: 'subevent',
          calendarUniqueId: self.calendarUniqueId,
          start: self.start.clone().add(1, 'hour'),
          end: self.end.clone().subtract(1, 'hour'),
          isRecurring: _.constant(false)
        };

        var invalidSubEvent = {
          id: 'invalid subevent',
          calendarUniqueId: self.calendarUniqueId,
          start: self.start.clone().subtract(2, 'days'),
          end: self.start.clone().subtract(1, 'hour'),
          isRecurring: _.constant(false)
        };

        self.modifiedEvent.id = 'parent';
        self.modifiedEvent.isRecurring = sinon.stub().returns(true);
        self.modifiedEvent.expand = sinon.stub().returns([correctSubEvent, invalidSubEvent]);
        self.calCachedEventSource.registerAdd(self.modifiedEvent);
        self.calCachedEventSource.wrapEventSource(self.calendarUniqueId, self.eventSource)(self.start, self.end, null, self.originalCallback);
        self.$rootScope.$apply();
        expect(self.modifiedEvent.isRecurring).to.have.been.called;
        expect(self.modifiedEvent.expand).to.have.been.calledWith(self.start.clone().subtract(1, 'day'), self.end.clone().add(1, 'day'));
        expect(self.originalCallback).to.have.been.calledWithExactly(self.events.concat(correctSubEvent));
      });

      it('should ignore a event if it is not on the same calendar even if it is in the requested period', function() {
        self.modifiedEvent.id = 3;
        self.modifiedEvent.calendarUniqueId = 'this_is_an_other_id';
        self.calCachedEventSource.registerAdd(self.modifiedEvent);
        self.calCachedEventSource.wrapEventSource(self.calendarUniqueId, self.eventSource)(self.start, self.end, null, self.originalCallback);
        self.$rootScope.$apply();
        expect(self.originalCallback).to.have.been.calledWithExactly(self.events);
      });

      it('should ignore a event that end before the first day of the requested period', function() {
        self.modifiedEvent.id = 3;
        self.modifiedEvent.start = self.calMoment([1983, 11, 31, 10, 0]);
        self.modifiedEvent.end = self.calMoment([1983, 11, 31, 23, 0]);
        self.calCachedEventSource.registerAdd(self.modifiedEvent);
        self.calCachedEventSource.wrapEventSource(self.calendarUniqueId, self.eventSource)(self.start, self.end, null, self.originalCallback);
        self.$rootScope.$apply();
        expect(self.originalCallback).to.have.been.calledWithExactly(self.events);
      });

      it('should ignore a event that start after the last day of the requested period', function() {
        self.modifiedEvent.id = 3;
        self.modifiedEvent.start = self.calMoment([1984, 0, 8, 0, 30]);
        self.modifiedEvent.end = self.calMoment([1984, 0, 8, 0, 45]);
        self.calCachedEventSource.registerAdd(self.modifiedEvent);
        self.calCachedEventSource.wrapEventSource(self.calendarUniqueId, self.eventSource)(self.start, self.end, null, self.originalCallback);
        self.$rootScope.$apply();
        expect(self.originalCallback).to.have.been.calledWithExactly(self.events);
      });
    });

  });
});
