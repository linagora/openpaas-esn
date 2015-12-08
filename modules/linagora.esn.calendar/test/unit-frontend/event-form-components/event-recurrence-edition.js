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

    this.initDirective = function(scope) {
      var html = '<event-recurrence-edition event="event" readonly="readOnly"/>';
      var element = this.$compile(html)(scope);
      scope.$digest();
      this.eleScope = element.isolateScope();
      return element;
    };
  }]));

  it('should initialize scope.event.rrule', function() {
    this.$scope.event = {};
    this.initDirective(this.$scope);
    expect(this.$scope.event).to.deep.equal({
      rrule: {
        freq: undefined
      }
    });
  });

  describe('scope.toggleWeekdays', function() {
    it('should splice the weekday and sort the array', function() {
      this.$scope.event = {};
      this.initDirective(this.$scope);
      this.$scope.event.rrule.byday = ['SU', 'WE', 'TU', 'MO'];
      this.eleScope.toggleWeekdays('W');
      expect(this.$scope.event.rrule.byday).to.deep.equal(['MO', 'TU', 'SU']);
    });

    it('should push the weekday and sort the array', function() {
      this.$scope.event = {};
      this.initDirective(this.$scope);
      this.$scope.event.rrule.byday = ['SU', 'WE', 'TU', 'MO'];
      this.eleScope.toggleWeekdays('F');
      expect(this.$scope.event.rrule.byday).to.deep.equal(['MO', 'TU', 'WE', 'FR', 'SU']);
    });
  });

  describe('scope.selectEndRadioButton', function() {
    it('should set the correct radio button to checked', function() {
      this.$scope.event = {
        rrule: {
          freq: 'WEEKLY'
        }
      };
      var element = this.initDirective(this.$scope);
      this.eleScope.selectEndRadioButton(2);
      var radio = angular.element(element).find('input[name="inlineRadioEndOptions"]')[2];
      expect(radio.checked).to.be.true;
    });

    it('should set until to undefined if index is 1', function() {
      this.$scope.event = {
        rrule: {
          freq: 'WEEKLY',
          until: 'UNTIL'
        }
      };
      this.initDirective(this.$scope);
      this.eleScope.selectEndRadioButton(1);
      expect(this.$scope.event.rrule.until).to.be.undefined;
    });

    it('should set count to undefined if index is 2', function() {
      this.$scope.event = {
        rrule: {
          freq: 'WEEKLY',
          count: 10
        }
      };
      this.initDirective(this.$scope);
      this.eleScope.selectEndRadioButton(2);
      expect(this.$scope.event.rrule.count).to.be.undefined;
    });
  });

});
