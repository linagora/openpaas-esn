'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Calendar Angular module directives', function() {
  beforeEach(function() {
    module('jadeTemplates');
    angular.mock.module('esn.calendar');
  });

  describe('The eventForm directive', function() {
    beforeEach(angular.mock.inject(function($timeout, $compile, $rootScope, moment, calendarUtils) {
      this.$timeout = $timeout;
      this.$compile = $compile;
      this.$rootScope = $rootScope;
      this.$scope = this.$rootScope.$new();
      this.moment = moment;
      this.calendarUtils = calendarUtils;

      this.initDirective = function(scope) {
        var html = '<event-quick-form/>';
        var element = this.$compile(html)(scope);
        scope.$digest();
        return element;
      };
    }));

    it('should have a focusSubmitButton method', function() {
      var element = this.initDirective(this.$scope);
      var submitButton = element.find('button[type="submit"]')[1];

      element.appendTo(document.body);
      this.$scope.focusSubmitButton();
      this.$timeout.flush();
      expect(document.activeElement).to.deep.equal(submitButton);
      element.remove();
    });

    it('should focus submit button on start date blur', function(done) {
      var element = this.initDirective(this.$scope);
      var startDateElement = element.find('input[bs-datepicker]').first();

      this.$scope.focusSubmitButton = done;
      this.$scope.$digest();
      startDateElement.appendTo(document.body);
      startDateElement.blur();
      this.$timeout.flush();
      startDateElement.remove();
    });

    it('should focus submit button on end date blur', function(done) {
      var element = this.initDirective(this.$scope);
      var endDateElement = element.find('input[bs-datepicker]').last();

      this.$scope.focusSubmitButton = done;
      this.$scope.$digest();
      endDateElement.appendTo(document.body);
      endDateElement.blur();
      this.$timeout.flush();
      endDateElement.remove();
    });

    it('should focus submit button on start time blur', function(done) {
      var element = this.initDirective(this.$scope);
      var startDateElement = element.find('input[bs-timepicker]').first();

      this.$scope.focusSubmitButton = done;
      this.$scope.$digest();
      startDateElement.appendTo(document.body);
      startDateElement.blur();
      this.$timeout.flush();
      startDateElement.remove();
    });

    it('should focus submit button on end time blur', function(done) {
      var element = this.initDirective(this.$scope);
      var endDateElement = element.find('input[bs-timepicker]').last();

      this.$scope.focusSubmitButton = done;
      this.$scope.$digest();
      endDateElement.appendTo(document.body);
      endDateElement.blur();
      this.$timeout.flush();
      endDateElement.remove();
    });

    it('should focus submit button on allday change', function(done) {
      var element = this.initDirective(this.$scope);
      var alldayElement = element.find('input[type="checkbox"]');

      this.$scope.focusSubmitButton = done;
      this.$scope.$digest();
      alldayElement.appendTo(document.body);
      var ngModelController = alldayElement.controller('ngModel');
      ngModelController.$setViewValue(true);
      this.$timeout.flush();
      alldayElement.remove();
    });

    it('should initiate $scope.editedEvent from $scope.event if it exists with id', function() {
      this.$scope.event = {
        _id: '123456',
        allDay: true,
        attendees: [{'displayName': 'user1@openpaas.org'}],
        start: this.moment('2013-02-08 12:30'),
        end: this.moment('2013-02-08 13:30')
      };
      this.initDirective(this.$scope);
      expect(this.$scope.editedEvent).to.shallowDeepEqual({
        _id: '123456',
        allDay: true,
        attendees: [{'displayName': 'user1@openpaas.org'}],
        diff: 3600000
      });
    });

    it('should initiate $scope.editedEvent with list of attendees ', function() {
      this.$scope.event = {
        _id: '123456',
        allDay: true,
        attendees: [{'displayName': 'user1@openpaas.org'}],
        start: this.moment('2013-02-08 12:30'),
        end: this.moment('2013-02-08 13:30')
      };
      this.initDirective(this.$scope);
      expect(this.$scope.editedEvent).to.shallowDeepEqual({
        _id: '123456',
        allDay: true,
        attendees: [{'displayName': 'user1@openpaas.org'}],
        diff: 3600000
      });
    });

    it('should initiate $scope.editedEvent with default values if $scope.event does not exists', function() {
      this.initDirective(this.$scope);
      expect(this.moment(this.$scope.editedEvent.start).isSame(this.calendarUtils.getNewStartDate())).to.be.true;
      expect(this.moment(this.$scope.editedEvent.end).isSame(this.calendarUtils.getNewEndDate())).to.be.true;
      expect(this.$scope.editedEvent.allDay).to.be.false;
    });
  });
});
