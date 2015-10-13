'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The event-full-form Angular module directives', function() {
  beforeEach(function() {
    module('jadeTemplates');
    angular.mock.module('linagora.esn.graceperiod');
    angular.mock.module('esn.calendar');
    this.gracePeriodService = {};

    var self = this;
    angular.mock.module(function($provide) {
      $provide.value('gracePeriodService', self.gracePeriodService);
    });
  });

  describe('submit fn', function() {
    var spyNewEvent = sinon.spy();
    var spyModifyEvent = sinon.spy();
    beforeEach(function() {
      angular.mock.module(function($provide, $controllerProvider) {
        $controllerProvider.register('eventFormController', function($scope) {
          $scope.event = {};
          $scope.editedEvent = {};
          this.initFormData = function() {};
          this.isNew = function() {
            return !$scope.selectedEvent._id;
          };
          this.addNewEvent = spyNewEvent;
          this.modifyEvent = spyModifyEvent;
        });
      });
    });

    beforeEach(angular.mock.inject(function($compile, $rootScope, moment) {
      this.$compile = $compile;
      this.$rootScope = $rootScope;
      this.$scope = this.$rootScope.$new();
      this.moment = moment;

      this.initDirective = function(scope) {
        var html = '<event-full-form/>';
        var element = this.$compile(html)(scope);
        scope.$digest();
        return element;
      };
    }));

    it('should have a submit function that is addNewEvent', function() {
      this.$scope.selectedEvent = {
        allDay: true,
        start: this.moment('2013-02-08 12:30'),
        end: this.moment('2013-02-08 13:30'),
        location: 'aLocation'
      };
      this.initDirective(this.$scope);
      this.$scope.submit();
      expect(spyNewEvent).to.have.been.called;
    });

    it('should have a submit function that is modifyEvent', function() {
      this.$scope.selectedEvent = {
        _id: '12345',
        allDay: true,
        start: this.moment('2013-02-08 12:30'),
        end: this.moment('2013-02-08 13:30'),
        location: 'aLocation'
      };
      this.initDirective(this.$scope);
      this.$scope.submit();
      expect(spyModifyEvent).to.have.been.called;
    });
  });

  describe('The eventFullForm directive', function() {
    beforeEach(angular.mock.inject(function($compile, $rootScope, $timeout, eventService) {
      this.$compile = $compile;
      this.$rootScope = $rootScope;
      this.$timeout = $timeout;
      this.$scope = this.$rootScope.$new();
      this.eventService = eventService;

      this.initDirective = function(scope) {
        var html = '<event-full-form/>';
        var element = this.$compile(html)(scope);
        scope.$digest();
        return element;
      };
    }));

    it('should reset eventService events on element $destroy', function() {
      this.eventService.originalEvent = { aEvent: 'aEvent' };
      this.eventService.editedEvent = { aEvent: 'aEvent' };
      var element = this.initDirective(this.$scope);
      element.remove();

      expect(this.eventService.originalEvent).to.deep.equal({});
      expect(this.eventService.editedEvent).to.deep.equal({});
    });

    describe('scope.goBack', function() {
      it('should $timeout the callback function in argument', function(done) {
        this.initDirective(this.$scope);
        this.$scope.goBack(done);
        this.$timeout.flush();
      });
    });
  });

});
