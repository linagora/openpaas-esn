'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The event-quick-form Angular module directives', function() {
  beforeEach(function() {
    module('jadeTemplates');
    angular.mock.module('linagora.esn.graceperiod');
    angular.mock.module('esn.calendar');
    this.gracePeriodService = {
      hasTaskFor: function() {}
    };
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
        $controllerProvider.register('eventFormController', function() {
          this.initFormData = function() {};
          this.addNewEvent = spyNewEvent;
          this.modifyEvent = spyModifyEvent;
        });
      });
    });

    beforeEach(angular.mock.inject(function($compile, $rootScope, fcMoment) {
      this.$compile = $compile;
      this.$rootScope = $rootScope;
      this.$scope = this.$rootScope.$new();
      this.fcMoment = fcMoment;

      this.initDirective = function(scope) {
        var html = '<event-quick-form/>';
        var element = this.$compile(html)(scope);
        scope.$digest();
        return element;
      };
    }));

    it('should have a submit function that is addNewEvent', function() {
      this.$scope.editedEvent = {
        allDay: true,
        start: this.fcMoment('2013-02-08 12:30'),
        end: this.fcMoment('2013-02-08 13:30'),
        location: 'aLocation'
      };
      this.initDirective(this.$scope);
      this.$scope.submit();
      expect(spyNewEvent).to.have.been.called;
    });

    it('should have a submit function that is modifyEvent if event has a gracePeriodTaskId property', function() {
      this.$scope.editedEvent = {
        id: '12345',
        allDay: true,
        start: this.fcMoment('2013-02-08 12:30'),
        end: this.fcMoment('2013-02-08 13:30'),
        location: 'aLocation',
        gracePeriodTaskId: '123456'
      };
      this.initDirective(this.$scope);
      this.$scope.submit();
      expect(spyModifyEvent).to.have.been.called;
    });

    it('should have a submit function that is modifyEvent if event has a etag property', function() {
      this.$scope.editedEvent = {
        id: '12345',
        allDay: true,
        start: this.fcMoment('2013-02-08 12:30'),
        end: this.fcMoment('2013-02-08 13:30'),
        location: 'aLocation',
        etag: '123456'
      };
      this.initDirective(this.$scope);
      this.$scope.submit();
      expect(spyModifyEvent).to.have.been.called;
    });
  });

  describe('The eventQuickForm directive', function() {
    beforeEach(angular.mock.inject(function($timeout, $compile, $rootScope, fcMoment, calendarUtils, eventUtils) {
      this.$timeout = $timeout;
      this.$compile = $compile;
      this.$rootScope = $rootScope;
      this.$scope = this.$rootScope.$new();
      this.fcMoment = fcMoment;
      this.calendarUtils = calendarUtils;
      this.eventUtils = eventUtils;

      this.initDirective = function(scope) {
        var html = '<event-quick-form/>';
        var element = this.$compile(html)(scope);
        scope.$digest();
        return element;
      };
    }));

    it('should initiate $scope.editedEvent and $scope.event from $scope.selectedEvent', function() {
      this.$scope.selectedEvent = {
        allDay: true,
        start: this.fcMoment('2013-02-08 12:30'),
        end: this.fcMoment('2013-02-08 13:30'),
        location: 'aLocation',
        clone: function() {
          return angular.copy(this);
        }
      };
      this.initDirective(this.$scope);
      expect(this.$scope.editedEvent).to.shallowDeepEqual({
        allDay: true,
        location: 'aLocation'
      });
      expect(this.$scope.event).to.shallowDeepEqual({
        allDay: true,
        location: 'aLocation'
      });
    });

    it('should initiate $scope.editedEvent with default values if $scope.event does not exists', function() {
      this.initDirective(this.$scope);
      expect(this.$scope.editedEvent.start.isSame(this.calendarUtils.getNewStartDate(), 'second')).to.be.true;
      expect(this.$scope.editedEvent.end.isSame(this.calendarUtils.getNewEndDate(), 'second')).to.be.true;
      expect(this.$scope.editedEvent.allDay).to.be.false;
    });

    it('should reset eventUtils events on element $destroy', function() {
      this.eventUtils.originalEvent = { aEvent: 'aEvent' };
      this.eventUtils.editedEvent = { aEvent: 'aEvent' };
      var element = this.initDirective(this.$scope);
      element.remove();

      expect(this.eventUtils.originalEvent).to.deep.equal({});
      expect(this.eventUtils.editedEvent).to.deep.equal({});
    });

    it('should prevent default back behavior when closeModal is shown', function(done) {
      this.initDirective(this.$scope);
      this.$scope.createModal = {
        $isShown: true,
        hide: function() {
          done();
        }
      };
      var event = this.$scope.$broadcast('$locationChangeStart');
      expect(event.defaultPrevented).to.be.true;
      expect(this.$scope.closeModal).toHaveBeenCalled();
    });

    it('should not prevent default back behavior when closeModal is not shown', function() {
      this.initDirective(this.$scope);
      this.$scope.createModal = {
        $isShown: false,
        hide: function() {
        }
      };
      var event = this.$scope.$broadcast('$locationChangeStart');
      expect(event.defaultPrevented).to.be.false;
    });

    it('should not prevent default back behavior when closeModal is undefined', function() {
      this.initDirective(this.$scope);
      var event = this.$scope.$broadcast('$locationChangeStart');
      expect(event.defaultPrevented).to.be.false;
    });

    describe('the closeModal function', function() {
      it('should cache the editedEvent using eventService#setEditedEvent', function(done) {
        this.initDirective(this.$scope);
        this.eventUtils.setEditedEvent = function(event) {
          expect(event).to.exist;
          done();
        };
        this.$scope.closeModal();
      });
    });
  });
});
