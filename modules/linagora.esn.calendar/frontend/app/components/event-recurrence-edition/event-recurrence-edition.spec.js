'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The event-recurrence-edition component', function() {

  beforeEach(function() {
    module('jadeTemplates');
    angular.mock.module('esn.calendar');
  });

  beforeEach(inject(['$compile', '$rootScope', function($c, $r) {
    this.$compile = $c;
    this.$scope = $r.$new();

    this.$scope.event = {
      getModifiedMaster: function() {
        return $q.when(this);
      },
      isInstance: function() {
        return false;
      }
    };

    this.$scope.canModifyEventRecurrence = false;

    this.initDirective = function(scope) {
      var html = '<event-recurrence-edition event="event" can-modify-event-recurrence="canModifyEventRecurrence"/>';
      var element = this.$compile(html)(scope);

      scope.$digest();
      this.eleScope = element.isolateScope();

      return element;
    };
  }]));

  describe('scope.toggleWeekdays', function() {
    it('should splice the weekday and sort the array', function() {
      this.$scope.event.rrule = {
        freq: undefined,
        interval: null
      };
      this.initDirective(this.$scope);
      this.eleScope.vm.event.rrule.byday = ['SU', 'WE', 'TU', 'MO'];
      this.eleScope.vm.toggleWeekdays('W');
      expect(this.eleScope.vm.event.rrule.byday).to.deep.equal(['MO', 'TU', 'SU']);
    });

    it('should push the weekday and sort the array', function() {
      this.$scope.event.rrule = {
        freq: undefined,
        interval: null
      };
      this.initDirective(this.$scope);
      this.eleScope.vm.event.rrule.byday = ['SU', 'WE', 'TU', 'MO'];
      this.eleScope.vm.toggleWeekdays('F');
      expect(this.eleScope.vm.event.rrule.byday).to.deep.equal(['MO', 'TU', 'WE', 'FR', 'SU']);
    });
  });

  describe('scope.selectEndRadioButton', function() {
    it('should set the correct radio button to checked', function() {
      this.$scope.event.rrule = {
        freq: 'WEEKLY'
      };
      var element = this.initDirective(this.$scope);

      this.eleScope.selectEndRadioButton(2);
      var radio = angular.element(element).find('input[name="inlineRadioEndOptions"]')[2];

      expect(radio.checked).to.be.true;
    });

    it('should set until to undefined if index is 1', function() {
      this.$scope.event.rrule = {
        freq: 'WEEKLY',
        until: 'UNTIL'
      };
      this.initDirective(this.$scope);
      this.eleScope.selectEndRadioButton(1);
      expect(this.eleScope.vm.event.rrule.until).to.be.undefined;
    });

    it('should set count to undefined if index is 2', function() {
      this.$scope.event.rrule = {
        freq: 'WEEKLY',
        count: 10
      };
      this.initDirective(this.$scope);
      this.eleScope.selectEndRadioButton(2);
      expect(this.eleScope.vm.event.rrule.count).to.be.undefined;
    });
  });

  describe('scope.setRRULE', function() {
    beforeEach(function() {
      this.initDirective(this.$scope);
    });

    it('should set rrule to undefined if scope.freq equal undefined', function() {
      this.eleScope.vm.freq = undefined;
      this.eleScope.vm.setRRULE();
      expect(this.eleScope.vm.event.rrule).to.be.undefined;
    });

    it('should set rrule if scope is not undefined', function() {
      this.eleScope.vm.freq = 'WEEKLY';
      this.eleScope.vm.setRRULE();
      expect(this.eleScope.vm.event.rrule.freq).to.be.equal('WEEKLY');
    });

    it('should set the interval to one if it was not previously defined', function() {
      this.eleScope.vm.freq = 'WEEKLY';
      this.eleScope.vm.setRRULE();
      expect(this.eleScope.vm.event.rrule.interval).to.be.equal(1);
      this.eleScope.vm.event.rrule.interval = undefined;
      this.eleScope.vm.setRRULE();
      expect(this.eleScope.vm.event.rrule.interval).to.be.equal(1);
    });

    it('should keep previous interval if it was defined and more than 0', function() {
      this.eleScope.vm.event.rrule = {freq: 'WEEKLY', interval: 42};
      this.eleScope.vm.freq = 'YEARLY';
      this.eleScope.vm.setRRULE();
      expect(this.eleScope.vm.event.rrule).to.be.deep.equals({freq: 'YEARLY', interval: 42});
      this.eleScope.vm.event.rrule.interval = 0;
      this.eleScope.vm.freq = 'WEEKLY';
      this.eleScope.vm.setRRULE();
      expect(this.eleScope.vm.event.rrule).to.be.deep.equals({freq: 'WEEKLY', interval: 1});
    });
  });
});
