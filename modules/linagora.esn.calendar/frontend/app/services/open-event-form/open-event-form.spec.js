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
      setEditedEvent: sinon.spy(),
      isOrganizer: sinon.stub().returns(false)
    };
    this.$modal = sinon.spy();
    this.$state = {
      go: sinon.spy()
    };
    this.calendarService = {
      calendarHomeId: '123'
    };
    this.regularEvent = {
      id: '456',
      isInstance: sinon.stub().returns(false),
      isPublic: sinon.stub().returns(true)
    };
    this.master = {};
    this.instance = {
      id: '456',
      isInstance: sinon.stub().returns(true),
      getModifiedMaster: sinon.spy(function() {
        return self.$q.when(self.master);
      }),
      isPublic: sinon.stub().returns(true)
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

  beforeEach(angular.mock.inject(function(calOpenEventForm, $q, $rootScope, SM_XS_MEDIA_QUERY, _CALENDAR_EVENTS_) {
    this.SM_XS_MEDIA_QUERY = SM_XS_MEDIA_QUERY;
    this.calOpenEventForm = calOpenEventForm;
    this.$q = $q;
    this.$rootScope = $rootScope;
    this.CALENDAR_EVENTS = _CALENDAR_EVENTS_;
  }));

  describe('calOpenEventForm', function() {
    it('should call $modal if matchmedia is md', function() {
      this.matchmedia.is = sinon.stub().returns(false);

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

    it('should hide modal when CALENDAR_EVENTS.MODAL.hide is broadcasted', function(done) {
      var self = this;
      var calendarUnselectListenerSpy = sinon.spy();

      self.$rootScope.$on(self.CALENDAR_EVENTS.CALENDAR_UNSELECT, calendarUnselectListenerSpy);
      self.matchmedia.is = sinon.stub().returns(false);

      self.calOpenEventForm(this.regularEvent);

      expect(this.$modal).to.have.been.calledWith(sinon.match({
        controller: sinon.match.func.and(sinon.match(function(controller) {
          var openForm = sinon.spy();
          var $hide = sinon.spy();

          var $scope = {
            $hide: $hide
          };

          controller($scope, self.instance, openForm);

          self.$rootScope.$broadcast(self.CALENDAR_EVENTS.MODAL + '.hide');

          expect($hide).to.have.been.called;
          expect(calendarUnselectListenerSpy).to.have.been.called;

          done();

          return true;
        }))
      }));
    });

    it('should unregister the listner of CALENDAR_EVENTS.MODAL.hide after hiding the modal', function(done) {
      var self = this;
      var calendarUnselectListenerSpy = sinon.spy();

      self.matchmedia.is = sinon.stub().returns(false);

      self.$rootScope.$on(self.CALENDAR_EVENTS.CALENDAR_UNSELECT, calendarUnselectListenerSpy);

      this.calOpenEventForm(this.regularEvent);

      expect(this.$modal).to.have.been.calledWith(sinon.match({
        controller: sinon.match.func.and(sinon.match(function(controller) {
          var openForm = sinon.spy();
          var $hide = sinon.spy();

          var $scope = {
            $hide: $hide
          };

          controller($scope, self.instance, openForm);

          self.$rootScope.$broadcast(self.CALENDAR_EVENTS.MODAL + '.hide');
          self.$rootScope.$broadcast(self.CALENDAR_EVENTS.MODAL + '.hide');

          expect($hide).to.have.been.calledOnce;
          expect(calendarUnselectListenerSpy).to.have.been.calledOnce;

          done();

          return true;
        }))
      }));
    });

    it('should call $state to calendar.event.form if matchmedia is xs or sm and isOrganizer', function() {
      this.matchmedia.is = sinon.stub().returns(true);
      this.calEventUtils.isOrganizer = sinon.stub().returns(true);

      this.calOpenEventForm(this.regularEvent);

      expect(this.matchmedia.is).to.have.been.calledWith(this.SM_XS_MEDIA_QUERY);
      expect(this.$modal).to.have.not.been.called;
      expect(this.$state.go).to.have.been.calledWith('calendar.event.form', {calendarHomeId: '123', eventId: '456'});
      expect(this.calEventUtils.isOrganizer).to.have.been.called;
    });

    it('should call $state to calendar.event.consult if matchmedia is xs or sm and not isOrganizer', function() {
      this.matchmedia.is = sinon.stub().returns(true);
      this.calEventUtils.isOrganizer = sinon.stub().returns(false);

      this.calOpenEventForm(this.regularEvent);

      expect(this.matchmedia.is).to.have.been.calledWith(this.SM_XS_MEDIA_QUERY);
      expect(this.$modal).to.have.not.been.called;
      expect(this.$state.go).to.have.been.calledWith('calendar.event.consult', {calendarHomeId: '123', eventId: '456'});
      expect(this.calEventUtils.isOrganizer).to.have.been.called;
    });

    it('if event is a recurring event, it should ask for editing master or instance', function() {
      this.calOpenEventForm(this.instance);

      expect(this.$modal).to.have.been.calledWith(sinon.match({
        templateUrl: '/calendar/app/services/open-event-form/edit-instance-or-series',
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

    it('should prevent click action if event is private and current user is not the owner', function() {
      this.regularEvent.isPublic = sinon.stub().returns(false);

      var test = this.calOpenEventForm(this.regularEvent);

      expect(this.regularEvent.isInstance).to.have.not.been.called;
      expect(test).to.be.undefined;
    });
  });
});
