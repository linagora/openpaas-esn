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
    this.events = [{id: 1, title: 'should not be replaced'}, {id:2, title: 'to be replaced'}];
    this.calId = 'a/cal/id';

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

  beforeEach(angular.mock.inject(function(cachedEventSource, fcMoment, _CALENDAR_GRACE_DELAY_) {
    this.cachedEventSource = cachedEventSource;
    this.fcMoment = fcMoment;

    this.start = this.fcMoment('1984-01-01').stripTime();
    this.end = this.fcMoment('1984-01-07').stripTime();
    this.CALENDAR_GRACE_DELAY = _CALENDAR_GRACE_DELAY_;
    this.modifiedEvent = {
      id: 2,
      title: 'has been replaced',
      start: this.fcMoment('1984-01-03'),
      isRecurring: _.constant(false)
    };
  }));

  describe('wrapEventSource method', function() {
    it('should not modify the original event source if no crud event', function() {

      var eventSource = sinon.spy(function(start, end, timezone, callback) {
        expect([start, end, timezone]).to.be.deep.equals([self.start, self.end, self.timezone]);
        callback(self.events);
      });

      this.cachedEventSource.wrapEventSource(this.calId, eventSource)(this.start, this.end, this.timezone, this.originalCallback);
      expect(this.originalCallback).to.have.been.calledOnce;
      expect(this.originalCallback).to.have.been.calledWithExactly(this.events);
      expect(eventSource).to.have.been.calledOnce;
    });

    it('should ignore element added on other calendar', function() {
      this.modifiedEvent.id = 3;
      this.cachedEventSource.registerAdd(this.modifiedEvent, 'anOtherCalendar');
      this.cachedEventSource.wrapEventSource(this.calId, this.eventSource)(this.start, this.end, null, this.originalCallback);
      expect(this.originalCallback).to.have.been.calledWithExactly(self.events);
    });

  });

  describe('deleteRegistration function', function() {
    it('should delete all registered crud', function() {
      ['registerAdd', 'registerDelete', 'registerUpdate'].forEach(function(action) {
        this.cachedEventSource[action](this.modifiedEvent);
        this.cachedEventSource.deleteRegistration(this.modifiedEvent);
        this.cachedEventSource.wrapEventSource(this.calId, this.eventSource)(this.start, this.end, this.timezone, this.originalCallback);
        expect(this.originalCallback).to.have.been.calledWithExactly(self.events);
      }, this);
    });
  });

  describe('register functions', function() {

    it('should not replace event if those event has been crud since more than CALENDAR_GRACE_DELAY', function() {
      ['registerAdd', 'registerDelete', 'registerUpdate'].forEach(function(action) {
        this.cachedEventSource[action](this.modifiedEvent);
        expect(this.$timeout).to.have.been.calledWith(sinon.match.any, this.CALENDAR_GRACE_DELAY);
        this.$timeout.flush();
        this.cachedEventSource.wrapEventSource(this.calId, this.eventSource)(this.start, this.end, this.timezone, this.originalCallback);
        expect(this.originalCallback).to.have.been.calledWithExactly(self.events);
      }, this);
    });

    it('should not replace event if event that has been crud has been undo by the given callback when crud was registered', function() {
      ['registerAdd', 'registerDelete', 'registerUpdate'].forEach(function(action) {
        var undo = this.cachedEventSource[action](this.modifiedEvent);
        undo();
        this.cachedEventSource.wrapEventSource(this.calId, this.eventSource)(this.start, this.end, this.timezone, this.originalCallback);
        expect(this.originalCallback).to.have.been.calledWithExactly(self.events);
      }, this);
    });

    describe('registerUpdate function', function() {
      it('should take a event and make wrapped event sources replace event with same id from the original source by this one', function() {
        this.cachedEventSource.registerUpdate(this.modifiedEvent);
        this.cachedEventSource.wrapEventSource(this.calId, this.eventSource)(this.start, this.end, this.timezone, this.originalCallback);
        expect(this.originalCallback).to.have.been.calledWithExactly([self.events[0], self.modifiedEvent]);
      });
    });

    describe('registerDelete function', function() {
      it('should take a event and make wrapped event sources delete event with same id from the original source', function() {
        this.cachedEventSource.registerDelete(this.modifiedEvent);
        this.cachedEventSource.wrapEventSource(this.calId, this.eventSource)(this.start, this.end, this.timezone, this.originalCallback);
        expect(this.originalCallback).to.have.been.calledWithExactly([self.events[0]]);
      });
    });

    describe('registerAdd function', function() {

      it('should take a event and make wrapped event sources add this event if it is in the requested period and one the same calendar', function() {
        this.modifiedEvent.id = 3;
        this.cachedEventSource.registerAdd(this.modifiedEvent, this.calId);
        this.cachedEventSource.wrapEventSource(this.calId, this.eventSource)(this.start, this.end, null, this.originalCallback);
        expect(this.originalCallback).to.have.been.calledWithExactly(self.events.concat(this.modifiedEvent));
      });

      it('should take a event and make wrapped event sources add this event end even if only it\'s end is in the requested period', function() {
        this.modifiedEvent.id = 3;
        this.modifiedEvent.start = this.fcMoment('1984-01-06 10:00');
        this.modifiedEvent.end = this.fcMoment('1984-01-07 01:00');
        this.cachedEventSource.registerAdd(this.modifiedEvent, this.calId);
        this.cachedEventSource.wrapEventSource(this.calId, this.eventSource)(this.start, this.end, null, this.originalCallback);
        expect(this.originalCallback).to.have.been.calledWithExactly(self.events.concat(this.modifiedEvent));
      });

      it('should take a event and make wrapped event sources add this event end even if only it\'s start is in the requested period', function() {
        this.modifiedEvent.id = 3;
        this.modifiedEvent.start = this.fcMoment('1984-01-07 23:59');
        this.modifiedEvent.end = this.fcMoment('1984-01-08 00:45');
        this.cachedEventSource.registerAdd(this.modifiedEvent, this.calId);
        this.cachedEventSource.wrapEventSource(this.calId, this.eventSource)(this.start, this.end, null, this.originalCallback);
        expect(this.originalCallback).to.have.been.calledWithExactly(self.events.concat(this.modifiedEvent));
      });

      it('should take a recurring event and make wrapped event sources expand it and add his subevent in the requested period', function() {
        var correctSubEvent = {
          id: 'subevent',
          start: this.start.clone().add(1, 'hour'),
          end: this.end.clone().subtract(1, 'hour'),
          isRecurring: _.constant(false)
        };

        var invalidSubEvent = {
          id: 'invalid subevent',
          start: this.start.clone().subtract(2, 'days'),
          end: this.start.clone().subtract(1, 'hour'),
          isRecurring: _.constant(false)
        };

        this.modifiedEvent.id = 'parent';
        this.modifiedEvent.isRecurring = sinon.stub().returns(true);
        this.modifiedEvent.expand = sinon.stub().returns([correctSubEvent, invalidSubEvent]);
        this.cachedEventSource.registerAdd(this.modifiedEvent, this.calId);
        this.cachedEventSource.wrapEventSource(this.calId, this.eventSource)(this.start, this.end, null, this.originalCallback);
        expect(this.modifiedEvent.isRecurring).to.have.been.called;
        expect(this.modifiedEvent.expand).to.have.been.calledWith(this.start.clone().subtract(1, 'day'), this.end.clone().add(1, 'day'));
        expect(this.originalCallback).to.have.been.calledWithExactly(self.events.concat(correctSubEvent));
      });

      it('should ignore a event if it is not on the same calendar even if it is in the requested period', function() {
        this.modifiedEvent.id = 3;
        this.cachedEventSource.registerAdd(this.modifiedEvent, 'this_is_an_other_id');
        this.cachedEventSource.wrapEventSource(this.calId, this.eventSource)(this.start, this.end, null, this.originalCallback);
        expect(this.originalCallback).to.have.been.calledWithExactly(self.events);
      });

      it('should ignore a event that end before the first day of the requested period', function() {
        this.modifiedEvent.id = 3;
        this.modifiedEvent.start = this.fcMoment('1983-31-31 10:00');
        this.modifiedEvent.end = this.fcMoment('1983-31-31 23:00');
        this.cachedEventSource.registerAdd(this.modifiedEvent, this.calId);
        this.cachedEventSource.wrapEventSource(this.calId, this.eventSource)(this.start, this.end, null, this.originalCallback);
        expect(this.originalCallback).to.have.been.calledWithExactly(self.events);
      });

      it('should ignore a event that start after the last day of the requested period', function() {
        this.modifiedEvent.id = 3;
        this.modifiedEvent.start = this.fcMoment('1984-01-08 00:30');
        this.modifiedEvent.end = this.fcMoment('1984-01-08 00:45');
        this.cachedEventSource.registerAdd(this.modifiedEvent, this.calId);
        this.cachedEventSource.wrapEventSource(this.calId, this.eventSource)(this.start, this.end, null, this.originalCallback);
        expect(this.originalCallback).to.have.been.calledWithExactly(self.events);
      });
    });

  });
});
