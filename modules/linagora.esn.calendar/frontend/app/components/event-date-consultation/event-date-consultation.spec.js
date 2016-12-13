'use strict';

/* global chai: false */

var expect = chai.expect;

describe('the eventDateConsultation directive', function() {
  beforeEach(function() {
    module('jadeTemplates');
    angular.mock.module('esn.calendar');
  });

  beforeEach(angular.mock.inject(function($compile, $rootScope, calMoment, CalendarShell) {
    this.$compile = $compile;
    this.$rootScope = $rootScope;
    this.$scope = this.$rootScope.$new();
    this.calMoment = calMoment;
    this.CalendarShell = CalendarShell;

    this.initDirective = function(scope) {
      var html = '<event-date-consultation event="event"/>';
      var element = this.$compile(html)(scope);

      scope.$digest();

      return element.isolateScope();
    };
  }));

  describe('when the event is on one day', function() {

    describe('when scope.event.allday', function() {

      it('should set start day to well formatted days of scope.event.start and no end day', function() {
        this.$scope.event = this.CalendarShell.fromIncompleteShell({
          start: this.calMoment('2016-12-06'),
          end: this.calMoment('2016-12-07'),
          location: 'aLocation'
        });
        var isolateScope = this.initDirective(this.$scope);

        expect(isolateScope.vm.start).to.equal(this.$scope.event.start.format('MMMM D'));
        expect(isolateScope.vm.startVerbose).to.equal(this.$scope.event.start.format('MMMM D'));
        expect(isolateScope.vm.end).to.be.undefined;
        expect(isolateScope.vm.endVerbose).to.be.undefined;
      });
    });

    describe('when scope.event is not an all day event', function() {

      it('should set start day to formatted value of scope.event.start and the end day to scope.event.end hours & minutes', function() {
        this.$scope.event = this.CalendarShell.fromIncompleteShell({
          start: this.calMoment('2016-12-06 00:00'),
          end: this.calMoment('2016-12-06 01:00'),
          location: 'aLocation'
        });
        var isolateScope = this.initDirective(this.$scope);

        expect(isolateScope.vm.start).to.equal(this.$scope.event.start.format('MMM D hh:mma'));
        expect(isolateScope.vm.startVerbose).to.equal(this.$scope.event.start.format('MMMM D hh:mma'));
        expect(isolateScope.vm.end).to.equal(this.$scope.event.end.format('hh:mma'));
        expect(isolateScope.vm.endVerbose).to.equal(this.$scope.event.end.format('hh:mma'));
      });
    });
  });

  describe('when the event is on more than one day', function() {

    describe('when scope.event.allday', function() {

      it('should set scope.start and scope.end to well formatted days of scope.event start and end (no hours no minutes)', function() {
        this.$scope.event = this.CalendarShell.fromIncompleteShell({
          start: this.calMoment('2016-12-06'),
          end: this.calMoment('2016-12-08'),
          location: 'aLocation'
        });
        var isolateScope = this.initDirective(this.$scope);

        expect(isolateScope.vm.start).to.equal(this.$scope.event.start.format('MMM D'));
        expect(isolateScope.vm.startVerbose).to.equal(this.$scope.event.start.format('MMMM D'));
        expect(isolateScope.vm.end).to.equal(this.$scope.event.end.clone().subtract(1, 'day').format('MMM D'));
        expect(isolateScope.vm.endVerbose).to.equal(this.$scope.event.end.clone().subtract(1, 'day').format('MMMM D'));
      });
    });

    describe('when scope.event is not an all day event', function() {

      it('should set scope.start to formatted value of scope.event.start and scope.event to scope.event.edn hours & minutes', function() {
        this.$scope.event = this.CalendarShell.fromIncompleteShell({
          start: this.calMoment('2016-12-06 00:00'),
          end: this.calMoment('2016-12-07 01:00'),
          location: 'aLocation'
        });
        var isolateScope = this.initDirective(this.$scope);

        expect(isolateScope.vm.start).to.equal(this.$scope.event.start.format('MMM D'));
        expect(isolateScope.vm.startVerbose).to.equal(this.$scope.event.start.format('MMMM D'));
        expect(isolateScope.vm.end).to.equal(this.$scope.event.end.format('MMM D'));
        expect(isolateScope.vm.endVerbose).to.equal(this.$scope.event.end.format('MMMM D'));
      });
    });
  });
});
