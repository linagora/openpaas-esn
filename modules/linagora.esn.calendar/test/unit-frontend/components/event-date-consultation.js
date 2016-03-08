'use strict';

/* global chai: false */

var expect = chai.expect;

describe('the eventDateConsultation directive', function() {
  beforeEach(function() {
    module('jadeTemplates');
    angular.mock.module('esn.calendar');
  });

  beforeEach(angular.mock.inject(function($compile, $rootScope, fcMoment) {
    this.$compile = $compile;
    this.$rootScope = $rootScope;
    this.$scope = this.$rootScope.$new();
    this.fcMoment = fcMoment;

    this.initDirective = function(scope) {
      var html = '<event-date-consultation event="event"/>';
      var element = this.$compile(html)(scope);
      scope.$digest();
      return element.isolateScope();
    };
  }));

  describe('when scope.event.allday', function() {
    it('should set scope.start and scope.end to well formatted days of scope.event start and end (no hours nor minutes)', function() {
      this.$scope.event = {
        allDay: true,
        start: this.fcMoment('2013-02-08 12:30'),
        end: this.fcMoment('2013-02-09 13:30'),
        location: 'aLocation'
      };
      var isolateScope = this.initDirective(this.$scope);
      expect(isolateScope.start).to.equal(this.$scope.event.start.format('MMMM D'));
      expect(isolateScope.end).to.equal(this.$scope.event.end.clone().subtract(1, 'day').format('MMMM D'));
    });
  });

  describe('when scope.event is not an all day event', function() {
    describe('when the event is within one day', function() {
      it('should set scope.start to formatted value of scope.event.start and scope.event to scope.event.edn hours & minutes', function() {
        this.$scope.event = {
          allDay: false,
          start: this.fcMoment('2013-02-08 12:30'),
          end: this.fcMoment('2013-02-08 13:30'),
          location: 'aLocation'
        };
        var isolateScope = this.initDirective(this.$scope);
        expect(isolateScope.start).to.equal(this.$scope.event.start.format('MMMM D hh:mma'));
        expect(isolateScope.end).to.equal(this.$scope.event.end.format('hh:mma'));
      });
    });

    describe('when the event is on more than one day', function() {
      it('should set scope.start to formatted value of scope.event.start and scope.event to scope.event.edn hours & minutes', function() {
        this.$scope.event = {
          allDay: false,
          start: this.fcMoment('2013-02-08 12:30'),
          end: this.fcMoment('2013-02-09 13:30'),
          location: 'aLocation'
        };
        var isolateScope = this.initDirective(this.$scope);
        expect(isolateScope.start).to.equal(this.$scope.event.start.format('MMMM D hh:mma'));
        expect(isolateScope.end).to.equal(this.$scope.event.end.format('MMMM D hh:mma'));
      });
    });
  });
});
