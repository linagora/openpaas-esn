'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The open-event-form service', function() {
  var $modal, $q, $rootScope, $state, calEventUtils, calOpenEventForm, calendarService, calUIAuthorizationService, notificationFactory, matchmedia, CAL_DEFAULT_CALENDAR_ID, CAL_EVENTS, SM_XS_MEDIA_QUERY;
  var instance, master, regularEvent;

  beforeEach(function() {
    matchmedia = {};
    calEventUtils = {
      setEditedEvent: sinon.spy()
    };
    $modal = sinon.spy();
    $state = {
      go: sinon.spy()
    };
    calendarService = {
      calendarHomeId: '123',
      getCalendar: sinon.spy(function() {
        return $q.when({});
      })
    };
    regularEvent = {
      id: '456',
      isInstance: sinon.stub().returns(false)
    };
    master = {};
    instance = {
      id: '456',
      isInstance: sinon.stub().returns(true),
      getModifiedMaster: sinon.spy(function() {
        return $q.when(master);
      }),
      isPublic: sinon.stub().returns(true)
    };

    angular.mock.module('linagora.esn.graceperiod', 'esn.calendar');
    angular.mock.module(function($provide) {
      $provide.value('matchmedia', matchmedia);
      $provide.value('calEventUtils', calEventUtils);
      $provide.value('$modal', $modal);
      $provide.value('$state', $state);
      $provide.value('calendarService', calendarService);
    });
  });

  beforeEach(angular.mock.inject(function(_$q_, _$rootScope_, _calOpenEventForm_, _calUIAuthorizationService_, _notificationFactory_, _CAL_DEFAULT_CALENDAR_ID_, _CAL_EVENTS_, _SM_XS_MEDIA_QUERY_) {
    $rootScope = _$rootScope_;
    $q = _$q_;
    calOpenEventForm = _calOpenEventForm_;
    calUIAuthorizationService = _calUIAuthorizationService_;
    notificationFactory = _notificationFactory_;
    CAL_DEFAULT_CALENDAR_ID = _CAL_DEFAULT_CALENDAR_ID_;
    CAL_EVENTS = _CAL_EVENTS_;
    SM_XS_MEDIA_QUERY = _SM_XS_MEDIA_QUERY_;
  }));

  describe('calOpenEventForm', function() {
    var canAccessEventDetail, canModifyEvent;
    beforeEach(function() {
      canAccessEventDetail = true;
      canModifyEvent = true;

      sinon.stub(calUIAuthorizationService, 'canAccessEventDetails', function() {
        return canAccessEventDetail;
      });
      sinon.stub(calUIAuthorizationService, 'canModifyEvent', function() {
        return canModifyEvent;
      });

    });

    it('should call calendarService with event calendar id', function(done) {
      regularEvent.calendarId = 'Test';

      calendarService.getCalendar = sinon.spy(function(calendarHomeId, calendarId) {
        expect(calendarHomeId).to.equal('123');
        expect(calendarId).to.equal('Test');
        done();
      });

      calOpenEventForm(regularEvent);

      $rootScope.$digest();
    });

    it('should call calendarService with default calendar if event is new', function(done) {
      regularEvent = {
      };

      calendarService.getCalendar = sinon.spy(function(calendarHomeId, calendarId) {
        expect(calendarHomeId).to.equal('123');
        expect(calendarId).to.equal(CAL_DEFAULT_CALENDAR_ID);
        done();
      });

      calOpenEventForm(regularEvent);

      $rootScope.$digest();
    });

    it('should call $modal if matchmedia is md', function() {
      matchmedia.is = sinon.stub().returns(false);

      calOpenEventForm(regularEvent);

      $rootScope.$digest();

      expect(matchmedia.is).to.have.been.calledWith(SM_XS_MEDIA_QUERY);
      expect($modal).to.have.been.called;
      expect($state.go).to.not.have.been;
      expect($modal).to.have.been.calledWith(sinon.match({
        templateUrl: '/calendar/app/components/open-event-form/event-quick-form-view',
        backdrop: 'static',
        placement: 'center'
      }));
    });

    it('should call $modal only once even if clicking several times', function() {
      matchmedia.is = sinon.stub().returns(false);

      calOpenEventForm(regularEvent);
      calOpenEventForm(regularEvent);

      $rootScope.$digest();

      expect($modal).to.have.been.calledOnce;
    });

    it('should recall $modal if closed before', function() {
      matchmedia.is = sinon.stub().returns(false);

      calOpenEventForm(regularEvent);

      $rootScope.$digest();

      expect($modal).to.have.been.calledWith(sinon.match({
        controller: sinon.match.func.and(sinon.match(function(controller) {
          var openForm = sinon.spy();
          var $hide = sinon.spy();
          var $scope = {
            $hide: $hide
          };

          controller($scope, instance, openForm);
          $scope.$hide();
          expect($hide).to.have.been.called;
          return true;
        }))
      }));

      calOpenEventForm(regularEvent);

      $rootScope.$digest();

      expect($modal).to.have.been.calledTwice;
    });

    it('should hide modal when CAL_EVENTS.MODAL.hide is broadcasted', function(done) {
      var calendarUnselectListenerSpy = sinon.spy();

      $rootScope.$on(CAL_EVENTS.CALENDAR_UNSELECT, calendarUnselectListenerSpy);
      matchmedia.is = sinon.stub().returns(false);

      calOpenEventForm(regularEvent);

      $rootScope.$digest();

      expect($modal).to.have.been.calledWith(sinon.match({
        controller: sinon.match.func.and(sinon.match(function(controller) {
          var openForm = sinon.spy();
          var $hide = sinon.spy();

          var $scope = {
            $hide: $hide
          };

          controller($scope, instance, openForm);

          $rootScope.$broadcast(CAL_EVENTS.MODAL + '.hide');

          expect($hide).to.have.been.called;
          expect(calendarUnselectListenerSpy).to.have.been.called;

          done();

          return true;
        }))
      }));
    });

    it('should unregister the listener of CAL_EVENTS.MODAL.hide after hiding the modal', function(done) {
      var calendarUnselectListenerSpy = sinon.spy();

      matchmedia.is = sinon.stub().returns(false);

      $rootScope.$on(CAL_EVENTS.CALENDAR_UNSELECT, calendarUnselectListenerSpy);

      calOpenEventForm(regularEvent);

      $rootScope.$digest();

      expect($modal).to.have.been.calledWith(sinon.match({
        controller: sinon.match.func.and(sinon.match(function(controller) {
          var openForm = sinon.spy();
          var $hide = sinon.spy();

          var $scope = {
            $hide: $hide
          };

          controller($scope, instance, openForm);

          $rootScope.$broadcast(CAL_EVENTS.MODAL + '.hide');
          $rootScope.$broadcast(CAL_EVENTS.MODAL + '.hide');

          expect($hide).to.have.been.calledOnce;
          expect(calendarUnselectListenerSpy).to.have.been.calledOnce;

          done();

          return true;
        }))
      }));
    });

    it('should call $state to calendar.event.form if matchmedia is xs or sm and user can modify event', function() {
      matchmedia.is = sinon.stub().returns(true);
      canModifyEvent = true;

      calOpenEventForm(regularEvent);

      $rootScope.$digest();

      expect(matchmedia.is).to.have.been.calledWith(SM_XS_MEDIA_QUERY);
      expect($modal).to.have.not.been.called;
      expect($state.go).to.have.been.calledWith('calendar.event.form', {calendarHomeId: '123', eventId: '456'});
    });

    it('should call $state to calendar.event.consult if matchmedia is xs or sm and user cannot modify event', function() {
      matchmedia.is = sinon.stub().returns(true);
      canModifyEvent = false;

      calOpenEventForm(regularEvent);

      $rootScope.$digest();

      expect(matchmedia.is).to.have.been.calledWith(SM_XS_MEDIA_QUERY);
      expect($modal).to.have.not.been.called;
      expect($state.go).to.have.been.calledWith('calendar.event.consult', {calendarHomeId: '123', eventId: '456'});
    });

    it('if event is a recurring event, it should ask for editing master or instance', function() {
      calOpenEventForm(instance);

      $rootScope.$digest();

      expect($modal).to.have.been.calledWith(sinon.match({
        templateUrl: '/calendar/app/components/open-event-form/edit-instance-or-series',
        resolve: {
          event: sinon.match.func.and(sinon.match(function(eventGetter) {
            return eventGetter() === instance;
          }))
        },
        controller: sinon.match.func.and(sinon.match(function(controller) {
          var openForm = sinon.spy();
          var $scope = {
            $hide: sinon.spy()
          };

          controller($scope, instance, openForm);

          $scope.editInstance();
          $scope.editAllInstances();
          $rootScope.$digest();

          expect(openForm.firstCall).to.have.been.calledWith(instance);
          expect(openForm.secondCall).to.have.been.calledWith(master);
          expect($scope.$hide).to.have.been.calledTwice;

          return true;
        })),
        placement: 'center'
      }));
    });

    it('should prevent click action and display notification if event is private and current user is not the owner', function() {
      sinon.spy(notificationFactory, 'weakInfo');
      canAccessEventDetail = false;

      var openEventForm = calOpenEventForm(regularEvent);

      $rootScope.$digest();

      expect(regularEvent.isInstance).to.have.not.been.called;
      expect(notificationFactory.weakInfo).to.have.been.calledWith('Private event', 'Cannot access private event');
      expect(openEventForm).to.be.undefined;
    });
  });
});
