'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The open-event-form service', function() {
  var self;

  beforeEach(function() {
    self = this;
    this.screenSize = {};
    this.eventUtils = {
      setEditedEvent: sinon.spy()
    };
    this.$modal = sinon.spy();
    this.$state = {};
    this.calendarService = {
      calendarHomeId: '123'
    };

    this.regularEvent = {
      id: '456',
      isInstance: sinon.stub().returns(false)
    };

    this.master = {};

    this.instance = {
      id: '456',
      isInstance: sinon.stub().returns(true),
      getModifiedMaster: sinon.spy(function() {
        return self.$q.when(self.master);
      })
    };

    angular.mock.module('linagora.esn.graceperiod', 'esn.calendar');
    angular.mock.module(function($provide) {
      $provide.value('screenSize', self.screenSize);
      $provide.value('eventUtils', self.eventUtils);
      $provide.value('$modal', self.$modal);
      $provide.value('$state', self.$state);
      $provide.value('calendarService', self.calendarService);
    });
  });

  beforeEach(angular.mock.inject(function(openEventForm, $q, $rootScope) {
    this.openEventForm = openEventForm;
    this.$q = $q;
    this.$rootScope = $rootScope;
  }));

  describe('openEventForm', function() {
    it('should call $modal if screensize is md', function() {
      this.screenSize.is = sinon.stub().returns(false);
      this.$state.go = sinon.spy();

      this.openEventForm(this.regularEvent);
      expect(this.screenSize.is).to.have.been.calledWith('xs, sm');
      expect(this.$modal).to.have.been.called;
      expect(this.$state.go).to.not.have.been;
      expect(this.$modal).to.have.been.calledWith(sinon.match({
        templateUrl: '/calendar/app/services/open-event-form/event-quick-form-view',
        backdrop: 'static',
        placement: 'center'
      }));
    });

    it('should call $state to calendar.event.form if screensize is xs or sm and isOrganizer', function() {
      this.screenSize.is = sinon.stub().returns(true);
      this.$state.go = sinon.spy();
      this.eventUtils.isOrganizer = sinon.stub().returns(true);

      this.openEventForm(this.regularEvent);
      expect(this.screenSize.is).to.have.been.calledWith('xs, sm');
      expect(this.$modal).to.have.not.been.called;
      expect(this.$state.go).to.have.been.calledWith('calendar.event.form', {calendarId: '123', eventId: '456'});
      expect(this.eventUtils.isOrganizer).to.have.been.called;
    });

    it('should call $state to calendar.event.consult if screensize is xs or sm and not isOrganizer', function() {
      this.screenSize.is = sinon.stub().returns(true);
      this.$state.go = sinon.spy();
      this.eventUtils.isOrganizer = sinon.stub().returns(false);

      this.openEventForm(this.regularEvent);
      expect(this.screenSize.is).to.have.been.calledWith('xs, sm');
      expect(this.$modal).to.have.not.been.called;
      expect(this.$state.go).to.have.been.calledWith('calendar.event.consult', {calendarId: '123', eventId: '456'});
      expect(this.eventUtils.isOrganizer).to.have.been.called;
    });

    it('if event is a recurring event, it should ask for editting master or instance', function() {
      this.openEventForm(this.instance);
      expect(this.$modal).to.have.been.calledWith(sinon.match({
        templateUrl: '/calendar/app/services/open-event-form/edit-instance-or-serie',
        resolve: {
          event: sinon.match.func.and(sinon.match(function(eventGetter) {
            return eventGetter() === self.instance;
          }))
        },
        controller: sinon.match.func.and(sinon.match(function(controller) {
          var openForm = sinon.spy();
          var $scope = {
            $hide: sinon.spy()
          };

          controller($scope, self.instance, openForm);

          $scope.editInstance();
          $scope.editAllInstances();
          self.$rootScope.$digest();

          expect(openForm.firstCall).to.have.been.calledWith(self.instance);
          expect(openForm.secondCall).to.have.been.calledWith(self.master);
          expect($scope.$hide).to.have.been.calledTwice;
          return true;
        })),
        placement: 'center'
      }));
    });
  });
});
