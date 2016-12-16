'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The open-event-form service', function() {
  var self;

  beforeEach(function() {
    self = this;
    this.matchmedia = {};
    this.calEventUtils = {
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
      $provide.value('matchmedia', self.matchmedia);
      $provide.value('calEventUtils', self.calEventUtils);
      $provide.value('$modal', self.$modal);
      $provide.value('$state', self.$state);
      $provide.value('calendarService', self.calendarService);
    });
  });

  beforeEach(angular.mock.inject(function(calOpenEventForm, $q, $rootScope, SM_XS_MEDIA_QUERY) {
    this.SM_XS_MEDIA_QUERY = SM_XS_MEDIA_QUERY;
    this.calOpenEventForm = calOpenEventForm;
    this.$q = $q;
    this.$rootScope = $rootScope;
  }));

  describe('calOpenEventForm', function() {
    it('should call $modal if matchmedia is md', function() {
      this.matchmedia.is = sinon.stub().returns(false);
      this.$state.go = sinon.spy();

      this.calOpenEventForm(this.regularEvent);
      expect(this.matchmedia.is).to.have.been.calledWith(this.SM_XS_MEDIA_QUERY);
      expect(this.$modal).to.have.been.called;
      expect(this.$state.go).to.not.have.been;
      expect(this.$modal).to.have.been.calledWith(sinon.match({
        templateUrl: '/calendar/app/services/open-event-form/event-quick-form-view',
        backdrop: 'static',
        placement: 'center'
      }));
    });

    it('should call $modal only once even if clicking several times', function() {
      this.matchmedia.is = sinon.stub().returns(false);
      this.calOpenEventForm(this.regularEvent);
      this.calOpenEventForm(this.regularEvent);
      expect(this.$modal).to.have.been.calledOnce;
    });

    it('should recall $modal if closed before', function() {
      this.matchmedia.is = sinon.stub().returns(false);
      this.calOpenEventForm(this.regularEvent);
      expect(this.$modal).to.have.been.calledWith(sinon.match({
        controller: sinon.match.func.and(sinon.match(function(controller) {
          var openForm = sinon.spy();
          var $hide = sinon.spy();
          var $scope = {
            $hide: $hide
          };

          controller($scope, self.instance, openForm);
          $scope.$hide();
          expect($hide).to.have.been.called;
          return true;
        }))
      }));
      this.calOpenEventForm(this.regularEvent);
      expect(this.$modal).to.have.been.calledTwice;
    });

    it('should call $state to calendar.event.form if matchmedia is xs or sm and isOrganizer', function() {
      this.matchmedia.is = sinon.stub().returns(true);
      this.$state.go = sinon.spy();
      this.calEventUtils.isOrganizer = sinon.stub().returns(true);

      this.calOpenEventForm(this.regularEvent);
      expect(this.matchmedia.is).to.have.been.calledWith(this.SM_XS_MEDIA_QUERY);
      expect(this.$modal).to.have.not.been.called;
      expect(this.$state.go).to.have.been.calledWith('calendar.event.form', {calendarHomeId: '123', eventId: '456'});
      expect(this.calEventUtils.isOrganizer).to.have.been.called;
    });

    it('should call $state to calendar.event.consult if matchmedia is xs or sm and not isOrganizer', function() {
      this.matchmedia.is = sinon.stub().returns(true);
      this.$state.go = sinon.spy();
      this.calEventUtils.isOrganizer = sinon.stub().returns(false);

      this.calOpenEventForm(this.regularEvent);
      expect(this.matchmedia.is).to.have.been.calledWith(this.SM_XS_MEDIA_QUERY);
      expect(this.$modal).to.have.not.been.called;
      expect(this.$state.go).to.have.been.calledWith('calendar.event.consult', {calendarHomeId: '123', eventId: '456'});
      expect(this.calEventUtils.isOrganizer).to.have.been.called;
    });

    it('if event is a recurring event, it should ask for editting master or instance', function() {
      this.calOpenEventForm(this.instance);
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
