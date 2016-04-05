'use strict';

/* global chai: false */
/* global sinon: false */
/* global _: false */

var expect = chai.expect;

describe('The cachedEventSource service', function() {

  var self;

  beforeEach(function() {
    self = this;

    this.originalCallback = sinon.spy();
    this.calendarId = 'a/cal/id';

    this.eventSource = function(start, end, timezone, callback) {
      callback(self.events);
    };
    this.timezone = 'who care';

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
    this.cachedEventSource = cachedEventSource;
    this.fcMoment = fcMoment;
    this.events = [{
      id: 1,
      calendarId: this.calendarId,
      uid: 1,
      start: this.fcMoment.utc('1984-01-01 08:00'),
      end: this.fcMoment.utc('1984-01-01 09:00'),
      isRecurring: _.constant(false),
      isInstance: _.constant(false),
      title: 'should not be replaced'
    }, {
      id: 2,
      calendarId: this.calendarId,
      uid: 2,
      start: this.fcMoment.utc('1984-01-02 08:00'),
      end: this.fcMoment.utc('1984-01-02 09:00'),
      isRecurring: _.constant(false),
      isInstance: _.constant(false),
      title: 'to be replaced'
    }];

    this.start = this.fcMoment.utc('1984-01-01').stripTime();
    this.end = this.fcMoment.utc('1984-01-07').stripTime();
    this.$rootScope = $rootScope;
    this.modifiedEvent = {
      id: 2,
      calendarId: this.calendarId,
      title: 'has been replaced',
      start: this.fcMoment('1984-01-03'),
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

      this.cachedEventSource.wrapEventSource(this.calendarId, eventSource)(this.start, this.end, this.timezone, this.originalCallback);
      this.$rootScope.$apply();
      expect(this.originalCallback).to.have.been.calledOnce;
      expect(this.originalCallback).to.have.been.calledWithExactly(this.events);
      expect(eventSource).to.have.been.calledOnce;
    });

    it('should ignore element added on other calendar', function() {
      this.modifiedEvent.id = 3;
      this.modifiedEvent.calendarId = 'anOtherCalendar';
      this.cachedEventSource.registerAdd(this.modifiedEvent);
      this.cachedEventSource.wrapEventSource(this.calendarId, this.eventSource)(this.start, this.end, null, this.originalCallback);
      this.$rootScope.$apply();
      expect(this.originalCallback).to.have.been.calledWithExactly(self.events);
    });

    it('should not fetch twice event from the save source', function() {
      var eventSource = sinon.spy(function(start, end, timezone, callback) {
        expect([start, end, timezone]).to.be.deep.equals([self.start, self.end, self.timezone]);
        callback(self.events);
      });

      var wrappedEventSource = this.cachedEventSource.wrapEventSource(this.calendarId, eventSource);
      this.originalCallback = sinon.spy(function(events) {
        expect(_.sortBy(events, 'id')).to.deep.equals(_.sortBy(self.events, 'id'));
      });
      wrappedEventSource(this.start, this.end, this.timezone, this.originalCallback);
      wrappedEventSource(this.start, this.end, this.timezone, this.originalCallback);
      this.$rootScope.$apply();
      expect(eventSource).to.have.been.calledOnce;
      expect(this.originalCallback).to.have.been.calledTwice;
    });

  });

  describe('deleteRegistration function', function() {
    it('should delete all registered crud', function() {
      ['registerAdd', 'registerDelete', 'registerUpdate'].forEach(function(action) {
        this.cachedEventSource[action](this.modifiedEvent);
        this.cachedEventSource.deleteRegistration(this.modifiedEvent);
        this.cachedEventSource.wrapEventSource(this.calendarId, this.eventSource)(this.start, this.end, this.timezone, this.originalCallback);
        this.$rootScope.$apply();
        expect(this.originalCallback).to.have.been.calledWithExactly(self.events);
      }, this);
    });
  });

  describe('register functions', function() {

    it('should not replace event if event that has been crud has been undo by the given callback when crud was registered', function() {
      ['registerAdd', 'registerDelete', 'registerUpdate'].forEach(function(action) {
        var undo = this.cachedEventSource[action](this.modifiedEvent);
        undo();
        this.cachedEventSource.wrapEventSource(this.calendarId, this.eventSource)(this.start, this.end, this.timezone, this.originalCallback);
        this.$rootScope.$apply();
        expect(this.originalCallback).to.have.been.calledWithExactly(self.events);
      }, this);
    });

    describe('registerUpdate function', function() {
      it('should take a event and make wrapped event sources replace event with same id from the original source by this one', function() {
        this.cachedEventSource.registerUpdate(this.modifiedEvent);
        this.cachedEventSource.wrapEventSource(this.calendarId, this.eventSource)(this.start, this.end, this.timezone, this.originalCallback);
        this.$rootScope.$apply();
        expect(this.originalCallback).to.have.been.calledWithExactly([self.events[0], self.modifiedEvent]);
      });

      it('should take an event and make wrapped event sources add this one if it does not exist', function() {
        this.modifiedEvent.id = 3;
        this.cachedEventSource.registerUpdate(this.modifiedEvent);
        this.cachedEventSource.wrapEventSource(this.calendarId, this.eventSource)(this.start, this.end, this.timezone, this.originalCallback);
        this.$rootScope.$apply();
        expect(this.originalCallback).to.have.been.calledWithExactly(self.events.concat(self.modifiedEvent));
      });

      it('should take a recurring event modification that delete an instance and apply it correctly', function() {
        var invariantSubEvent = {
          id: 'subevent',
          uid: 'parent',
          start: this.start.clone().add(1, 'hour'),
          end: this.end.clone().subtract(1, 'hour'),
          isInstance: _.constant(true),
          isRecurring: _.constant(false)
        };

        var deletedSubEvent = {
          id: 'invalid subevent',
          uid: 'parent',
          start: this.start.clone().add(1, 'hour'),
          end: this.end.clone().subtract(1, 'hour'),
          isInstance: _.constant(true),
          isRecurring: _.constant(false)
        };

        this.modifiedEvent.id = 'parent';
        this.modifiedEvent.isRecurring = sinon.stub().returns(true);
        this.modifiedEvent.expand = sinon.stub().returns([invariantSubEvent]);
        this.events.push(invariantSubEvent);
        this.events.push(deletedSubEvent);

        this.cachedEventSource.registerUpdate(this.modifiedEvent);
        this.cachedEventSource.wrapEventSource(this.calendarId, this.eventSource)(this.start, this.end, this.timezone, this.originalCallback);
        this.$rootScope.$apply();

        expect(this.modifiedEvent.isRecurring).to.have.been.called;
        expect(this.modifiedEvent.expand).to.have.been.calledWith(this.start.clone().subtract(1, 'day'), this.end.clone().add(1, 'day'));

        expect(this.originalCallback).to.have.been.calledWithExactly(self.events.slice(0, self.events.length - 1));
      });

      it('should take a recurring event modification that modify an instance and apply it correctly', function() {
        var invariantSubEvent = {
          id: 'subevent',
          uid: 'parent',
          start: this.start.clone().add(1, 'hour'),
          end: this.end.clone().subtract(1, 'hour'),
          isInstance: _.constant(true),
          isRecurring: _.constant(false)
        };

        var modifiedSubInstanceBefore = {
          id: 'invalid subevent',
          uid: 'parent',
          start: this.start.clone().add(1, 'hour'),
          end: this.end.clone().subtract(1, 'hour'),
          isInstance: _.constant(true),
          isRecurring: _.constant(false)
        };

        var modifiedSubInstanceAfter = _.clone(modifiedSubInstanceBefore);
        modifiedSubInstanceAfter.title = 'Modified';

        this.modifiedEvent.id = 'parent';
        this.modifiedEvent.isRecurring = sinon.stub().returns(true);
        this.modifiedEvent.expand = sinon.stub().returns([invariantSubEvent, modifiedSubInstanceAfter]);
        this.events.push(invariantSubEvent);
        this.events.push(modifiedSubInstanceBefore);

        this.cachedEventSource.registerUpdate(this.modifiedEvent);
        this.cachedEventSource.wrapEventSource(this.calendarId, this.eventSource)(this.start, this.end, this.timezone, this.originalCallback);
        this.$rootScope.$apply();

        expect(this.modifiedEvent.isRecurring).to.have.been.called;
        expect(this.modifiedEvent.expand).to.have.been.calledWith(this.start.clone().subtract(1, 'day'), this.end.clone().add(1, 'day'));

        expect(this.originalCallback).to.have.been.calledWithExactly(self.events.slice(0, self.events.length - 1).concat(modifiedSubInstanceAfter));
      });

      it('should replace previous modification by new modification on recurring event', function() {
        var event1Before = {
          id: 'subevent',
          calendarId: this.calendarId,
          uid: 'parent',
          start: this.start.clone().add(1, 'hour'),
          end: this.end.clone().subtract(1, 'hour'),
          isInstance: _.constant(true),
          isRecurring: _.constant(false)
        };

        var event2 = {
          id: 'subevent 2',
          calendarId: this.calendarId,
          uid: 'parent',
          start: this.start.clone().add(1, 'hour'),
          end: this.end.clone().subtract(1, 'hour'),
          isInstance: _.constant(true),
          isRecurring: _.constant(false)
        };

        var event1After = _.clone(event1Before);
        event1After.title = 'after';

        this.modifiedEvent.id = 'parent';
        this.modifiedEvent.expand = sinon.stub().returns([event1Before, event2]);
        this.modifiedEvent.isRecurring = sinon.stub().returns(true);
        this.events = [];

        var wrapedEventSource = this.cachedEventSource.wrapEventSource(this.calendarId, this.eventSource);
        this.cachedEventSource.registerUpdate(this.modifiedEvent);
        wrapedEventSource(this.start, this.end, this.timezone, this.originalCallback);
        this.$rootScope.$apply();

        expect(this.modifiedEvent.isRecurring).to.have.been.called;
        expect(this.modifiedEvent.expand).to.have.been.calledWith(this.start.clone().subtract(1, 'day'), this.end.clone().add(1, 'day'));
        expect(this.originalCallback).to.have.been.calledWithExactly([event1Before, event2]);

        this.modifiedEvent.expand = sinon.stub().returns([event1After]);
        this.cachedEventSource.registerUpdate(this.modifiedEvent);
        wrapedEventSource(this.start, this.end, this.timezone, this.originalCallback);
        this.$rootScope.$apply();

        expect(this.modifiedEvent.isRecurring).to.have.been.called;
        expect(this.modifiedEvent.expand).to.have.been.calledWith(this.start.clone().subtract(1, 'day'), this.end.clone().add(1, 'day'));
        expect(this.originalCallback).to.have.been.calledWithExactly([event1After]);
      });

      it('should take a recurring event and make wrapped event sources add this one if it does not exist', function() {
        var correctSubEvent = {
          id: 'subevent',
          calendarId: this.calendarId,
          start: this.start.clone().add(1, 'hour'),
          end: this.end.clone().subtract(1, 'hour'),
          isRecurring: _.constant(false)
        };

        var invalidSubEvent = {
          id: 'invalid subevent',
          calendarId: this.calendarId,
          start: this.start.clone().subtract(2, 'days'),
          end: this.start.clone().subtract(1, 'hour'),
          isRecurring: _.constant(false)
        };

        this.modifiedEvent.id = 'parent';
        this.modifiedEvent.isRecurring = sinon.stub().returns(true);
        this.modifiedEvent.expand = sinon.stub().returns([correctSubEvent, invalidSubEvent]);

        this.cachedEventSource.registerUpdate(this.modifiedEvent);
        this.cachedEventSource.wrapEventSource(this.calendarId, this.eventSource)(this.start, this.end, this.timezone, this.originalCallback);
        this.$rootScope.$apply();

        expect(this.modifiedEvent.isRecurring).to.have.been.called;
        expect(this.modifiedEvent.expand).to.have.been.calledWith(this.start.clone().subtract(1, 'day'), this.end.clone().add(1, 'day'));

        expect(this.originalCallback).to.have.been.calledWithExactly(self.events.concat(correctSubEvent));
      });

    });

    describe('registerDelete function', function() {
      it('should take a event and make wrapped event sources delete event with same id from the original source', function() {
        this.cachedEventSource.registerDelete(this.modifiedEvent);
        this.cachedEventSource.wrapEventSource(this.calendarId, this.eventSource)(this.start, this.end, this.timezone, this.originalCallback);
        this.$rootScope.$apply();
        expect(this.originalCallback).to.have.been.calledWithExactly([self.events[0]]);
      });
    });

    describe('registerAdd function', function() {

      it('should take a event and make wrapped event sources add this event if it is in the requested period and one the same calendar', function() {
        this.modifiedEvent.id = 3;
        this.cachedEventSource.registerAdd(this.modifiedEvent);
        this.cachedEventSource.wrapEventSource(this.calendarId, this.eventSource)(this.start, this.end, null, this.originalCallback);
        this.$rootScope.$apply();
        expect(this.originalCallback).to.have.been.calledWithExactly(self.events.concat(this.modifiedEvent));
      });

      it('should take a event and make wrapped event sources add this event end even if only it\'s end is in the requested period', function() {
        this.modifiedEvent.id = 3;
        this.modifiedEvent.start = this.fcMoment('1984-01-06 10:00');
        this.modifiedEvent.end = this.fcMoment('1984-01-07 01:00');
        this.cachedEventSource.registerAdd(this.modifiedEvent);
        this.cachedEventSource.wrapEventSource(this.calendarId, this.eventSource)(this.start, this.end, null, this.originalCallback);
        this.$rootScope.$apply();
        expect(this.originalCallback).to.have.been.calledWithExactly(self.events.concat(this.modifiedEvent));
      });

      it('should take a event and make wrapped event sources add this event end even if only it\'s start is in the requested period', function() {
        this.modifiedEvent.id = 3;
        this.modifiedEvent.start = this.fcMoment('1984-01-07 23:59');
        this.modifiedEvent.end = this.fcMoment('1984-01-08 00:45');
        this.cachedEventSource.registerAdd(this.modifiedEvent);
        this.cachedEventSource.wrapEventSource(this.calendarId, this.eventSource)(this.start, this.end, null, this.originalCallback);
        this.$rootScope.$apply();
        expect(this.originalCallback).to.have.been.calledWithExactly(self.events.concat(this.modifiedEvent));
      });

      it('should take a recurring event and make wrapped event sources expand it and add his subevent in the requested period', function() {
        var correctSubEvent = {
          id: 'subevent',
          calendarId: this.calendarId,
          start: this.start.clone().add(1, 'hour'),
          end: this.end.clone().subtract(1, 'hour'),
          isRecurring: _.constant(false)
        };

        var invalidSubEvent = {
          id: 'invalid subevent',
          calendarId: this.calendarId,
          start: this.start.clone().subtract(2, 'days'),
          end: this.start.clone().subtract(1, 'hour'),
          isRecurring: _.constant(false)
        };

        this.modifiedEvent.id = 'parent';
        this.modifiedEvent.isRecurring = sinon.stub().returns(true);
        this.modifiedEvent.expand = sinon.stub().returns([correctSubEvent, invalidSubEvent]);
        this.cachedEventSource.registerAdd(this.modifiedEvent);
        this.cachedEventSource.wrapEventSource(this.calendarId, this.eventSource)(this.start, this.end, null, this.originalCallback);
        this.$rootScope.$apply();
        expect(this.modifiedEvent.isRecurring).to.have.been.called;
        expect(this.modifiedEvent.expand).to.have.been.calledWith(this.start.clone().subtract(1, 'day'), this.end.clone().add(1, 'day'));
        expect(this.originalCallback).to.have.been.calledWithExactly(self.events.concat(correctSubEvent));
      });

      it('should ignore a event if it is not on the same calendar even if it is in the requested period', function() {
        this.modifiedEvent.id = 3;
        this.modifiedEvent.calendarId =  'this_is_an_other_id';
        this.cachedEventSource.registerAdd(this.modifiedEvent);
        this.cachedEventSource.wrapEventSource(this.calendarId, this.eventSource)(this.start, this.end, null, this.originalCallback);
        this.$rootScope.$apply();
        expect(this.originalCallback).to.have.been.calledWithExactly(self.events);
      });

      it('should ignore a event that end before the first day of the requested period', function() {
        this.modifiedEvent.id = 3;
        this.modifiedEvent.start = this.fcMoment('1983-31-31 10:00');
        this.modifiedEvent.end = this.fcMoment('1983-31-31 23:00');
        this.cachedEventSource.registerAdd(this.modifiedEvent);
        this.cachedEventSource.wrapEventSource(this.calendarId, this.eventSource)(this.start, this.end, null, this.originalCallback);
        this.$rootScope.$apply();
        expect(this.originalCallback).to.have.been.calledWithExactly(self.events);
      });

      it('should ignore a event that start after the last day of the requested period', function() {
        this.modifiedEvent.id = 3;
        this.modifiedEvent.start = this.fcMoment('1984-01-08 00:30');
        this.modifiedEvent.end = this.fcMoment('1984-01-08 00:45');
        this.cachedEventSource.registerAdd(this.modifiedEvent);
        this.cachedEventSource.wrapEventSource(this.calendarId, this.eventSource)(this.start, this.end, null, this.originalCallback);
        this.$rootScope.$apply();
        expect(this.originalCallback).to.have.been.calledWithExactly(self.events);
      });
    });

  });
});

describe('the calendarExploredPeriodService service', function() {

  var self;

  function buildPeriod(start, end) {
    return {
      start: self.fcMoment([2000, 1, start]).stripTime(),
      end: self.fcMoment([2000, 1, end]).stripTime()
    };
  }

  function periodToComparablePeriod(period) {
    return {
      start: period.start.format('YYYY-MM-DD'),
      end: period.end.format('YYYY-MM-DD')
    };
  }

  beforeEach(function() {
    self = this;
    angular.mock.module('esn.calendar');
  });

  beforeEach(angular.mock.inject(function(fcMoment, calendarExploredPeriodService) {
    this.calendarExploredPeriodService = calendarExploredPeriodService;
    this.fcMoment = fcMoment;
    this.aPeriod = buildPeriod(1, 15);
  }));

  describe('the reset function', function() {

    it('should remove all registeredExploredPeriod in the calendar of the given id', function() {
      this.calendarExploredPeriodService.registerExploredPeriod('calendarId', this.aPeriod);
      this.calendarExploredPeriodService.registerExploredPeriod('calendarId2', this.aPeriod);
      this.calendarExploredPeriodService.reset('calendarId');
      expect(this.calendarExploredPeriodService.getUnexploredPeriodsInPeriod('calendarId', this.aPeriod).map(periodToComparablePeriod)).to.deep.equals([this.aPeriod].map(periodToComparablePeriod));
      expect(this.calendarExploredPeriodService.getUnexploredPeriodsInPeriod('calendarId2', this.aPeriod).map(periodToComparablePeriod)).to.deep.equals([]);
    });

    it('should remove all egisteredExploredPeriod in all the calendar if no given id', function() {
      this.calendarExploredPeriodService.registerExploredPeriod('calendarId', this.aPeriod);
      this.calendarExploredPeriodService.registerExploredPeriod('calendarId2', this.aPeriod);
      this.calendarExploredPeriodService.reset();
      expect(this.calendarExploredPeriodService.getUnexploredPeriodsInPeriod('calendarId', this.aPeriod).map(periodToComparablePeriod)).to.deep.equals([this.aPeriod].map(periodToComparablePeriod));
      expect(this.calendarExploredPeriodService.getUnexploredPeriodsInPeriod('calendarId2', this.aPeriod).map(periodToComparablePeriod)).to.deep.equals([this.aPeriod].map(periodToComparablePeriod));
    });
  });

  describe('the regiserExploredPeriod', function() {

    it('should save a explored period in his calendar', function() {
      this.calendarExploredPeriodService.registerExploredPeriod('calId', this.aPeriod);
      expect(this.calendarExploredPeriodService.getUnexploredPeriodsInPeriod('calId', this.aPeriod)).to.deep.equals([]);
      expect(this.calendarExploredPeriodService.getUnexploredPeriodsInPeriod('calId2', this.aPeriod)).to.not.deep.equals();
    });

    it('should groups adjudent period', function() {
      this.calendarExploredPeriodService.registerExploredPeriod('calId', buildPeriod(1, 2));
      this.calendarExploredPeriodService.registerExploredPeriod('calId', buildPeriod(3, 4));
      this.calendarExploredPeriodService.registerExploredPeriod('calId', buildPeriod(5, 6));
      expect(this.calendarExploredPeriodService.getUnexploredPeriodsInPeriod('calId', buildPeriod(1, 6))).to.deep.equals([]);
    });

    it('should not groups non adjacent period', function() {
      this.calendarExploredPeriodService.registerExploredPeriod('calId', buildPeriod(1, 2));
      this.calendarExploredPeriodService.registerExploredPeriod('calId', buildPeriod(4, 5));
      expect(this.calendarExploredPeriodService.getUnexploredPeriodsInPeriod('calId', buildPeriod(1, 4))).to.not.deep.equals([]);
    });

    it('should remove periods included by a bigger one', function() {
      this.calendarExploredPeriodService.registerExploredPeriod('calId', buildPeriod(1, 2));
      this.calendarExploredPeriodService.registerExploredPeriod('calId', buildPeriod(4, 5));
      this.calendarExploredPeriodService.registerExploredPeriod('calId', buildPeriod(1, 5));
      expect(this.calendarExploredPeriodService.getUnexploredPeriodsInPeriod('calId', buildPeriod(1, 5))).to.deep.equals([]);
    });

    it('should remove periods included by a bigger one and groups resulting adjacent period', function() {
      this.calendarExploredPeriodService.registerExploredPeriod('calId', buildPeriod(1, 2));
      this.calendarExploredPeriodService.registerExploredPeriod('calId', buildPeriod(4, 5));
      this.calendarExploredPeriodService.registerExploredPeriod('calId', buildPeriod(6, 7));
      this.calendarExploredPeriodService.registerExploredPeriod('calId', buildPeriod(1, 5));
      expect(this.calendarExploredPeriodService.getUnexploredPeriodsInPeriod('calId', buildPeriod(1, 7))).to.deep.equals([]);
    });
  });

  describe('the getUnexploredPeriodsInPeriod', function() {
    it('should return the full period if non of it has been explored', function() {
      expect(this.calendarExploredPeriodService.getUnexploredPeriodsInPeriod('calId', this.aPeriod).map(periodToComparablePeriod)).to.deep.equals([this.aPeriod].map(periodToComparablePeriod));
    });

    it('should return nothing if the period already has been explored', function() {
      this.calendarExploredPeriodService.registerExploredPeriod('calId', buildPeriod(1, 4));
      expect(this.calendarExploredPeriodService.getUnexploredPeriodsInPeriod('calId', buildPeriod(2, 3))).to.deep.equals([]);
    });

    it('should return only non explored part of a period that has been partially explored', function() {
      this.calendarExploredPeriodService.registerExploredPeriod('calId', buildPeriod(3, 4));
      this.calendarExploredPeriodService.registerExploredPeriod('calId', buildPeriod(6, 7));

      var result = this.calendarExploredPeriodService.getUnexploredPeriodsInPeriod('calId', buildPeriod(1, 9));
      expect(result.map(periodToComparablePeriod)).to.deep.equals([buildPeriod(1, 2), buildPeriod(5, 5), buildPeriod(8, 9)].map(periodToComparablePeriod));

      result = this.calendarExploredPeriodService.getUnexploredPeriodsInPeriod('calId', buildPeriod(1, 3));
      expect(result.map(periodToComparablePeriod)).to.deep.equals([buildPeriod(1, 2)].map(periodToComparablePeriod));

      result = this.calendarExploredPeriodService.getUnexploredPeriodsInPeriod('calId', buildPeriod(6, 10));
      expect(result.map(periodToComparablePeriod)).to.deep.equals([buildPeriod(8, 10)].map(periodToComparablePeriod));
    });
  });
});

describe('eventStore', function() {
  var self;

  function createPeriod(start, end) {
    return {
      start: self.fcMoment.utc([2000, 1, start]).stripTime(),
      end: self.fcMoment.utc([2000, 1, end]).stripTime()
    };
  }

  function createEvent(calId, id, start, end) {
    return {
      id: id,
      calendarId: calId,
      start: self.fcMoment.utc([2000, 1, start, 0, 0]),
      end: self.fcMoment.utc([2000, 1, end, 0, 1])
    };
  }

  beforeEach(function() {
    self = this;
    angular.mock.module('esn.calendar');
  });

  beforeEach(angular.mock.inject(function(fcMoment, eventStore) {
    this.eventStore = eventStore;
    this.fcMoment = fcMoment;
  }));

  describe('reset function', function() {
    it('should destroy previously saved event in given calId', function() {
      var event = createEvent('calId', 'a', 2, 2);
      this.eventStore.save(event);
      event.calendarId = 'calId2';
      this.eventStore.save(event);
      this.eventStore.reset('calId');
      expect(this.eventStore.getInPeriod('calId', createPeriod(1, 30))).to.deep.equals([]);
      expect(this.eventStore.getInPeriod('calId2', createPeriod(1, 30))).to.deep.equals([event]);
    });

    it('should destroy previously saved event in all calendar if not cal id given', function() {
      var event = createEvent('calId', 'a', 2, 2);
      this.eventStore.save(event);
      event.calendarId = 'calId2';
      this.eventStore.save(event);
      this.eventStore.reset();
      expect(this.eventStore.getInPeriod('calId', createPeriod(1, 30))).to.deep.equals([]);
      expect(this.eventStore.getInPeriod('calId2', createPeriod(1, 30))).to.deep.equals([]);
    });
  });

  describe('save function', function() {
    it('should properly save an event in his calendar', function() {
      var event = createEvent('calId', 'a', 2, 2);
      var event2 = createEvent('calId2', 'b', 2, 2);
      this.eventStore.save(event);
      this.eventStore.save(event2);
      expect(this.eventStore.getInPeriod('calId', createPeriod(1, 30))).to.deep.equals([event]);
      expect(this.eventStore.getInPeriod('calId2', createPeriod(1, 30))).to.deep.equals([event2]);
    });

    it('should not save twice the same event', function() {
      var event = createEvent('calId', 'a', 2, 2);
      var event2 = createEvent('calId', 'b', 2, 2);
      this.eventStore.save(event);
      this.eventStore.save(createEvent('calId', 'a', 2, 2));
      expect(this.eventStore.getInPeriod('calId', createPeriod(1, 30))).to.deep.equals([event]);

      this.eventStore.save(event2);
      this.eventStore.save(createEvent('calId', 'a', 2, 2));
      expect(_.sortBy(this.eventStore.getInPeriod('calId', createPeriod(1, 30)), 'id')).to.deep.equals(_.sortBy([event, event2], 'id'));
    });
  });

  describe('getInPeriod function', function() {
    it('should obtain all event in period', function() {
      var event1 = createEvent('calId', '1', 13, 15);
      var event2 = createEvent('calId', '2', 15, 15);
      var event3 = createEvent('calId', '3', 13, 18);
      var event4 = createEvent('calId', '4', 14, 14);

      [event1, event2, event3, event4, createEvent('calId', '5', 11, 13), createEvent('calId', '6', 18, 18), createEvent('calId', '7', 13, 13), createEvent('calId', '8', 1, 1)].map(function(event) {
        self.eventStore.save(event);
      });
      expect(_.sortBy(this.eventStore.getInPeriod('calId', createPeriod(14, 17)), 'id')).to.deep.equals([event1, event2, event3, event4].sort());
    });
  });
});
