'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The calendar public configuration controller', function() {
  var $rootScope,
    $controller,
    $q,
    $state,
    $log,
    calendarService,
    calPublicCalendarStore,
    notificationFactory;

  beforeEach(function() {
    angular.mock.module('esn.calendar');
    angular.mock.inject(function(_$rootScope_, _$controller_, _$q_, _$state_, _$log_, _calendarService_, _calPublicCalendarStore_, _notificationFactory_) {
        $rootScope = _$rootScope_;
        $controller = _$controller_;
        $q = _$q_;
        $state = _$state_;
        $log = _$log_;
        calendarService = _calendarService_;
        calPublicCalendarStore = _calPublicCalendarStore_;
        notificationFactory = _notificationFactory_;
      }
    );
  });

  function initController() {
    return $controller('CalCalendarPublicConfigurationController');
  }

  describe('the updateButtonDisplay function', function() {
    it('should set disableButton at true is users array is empty', function() {
      var ctrl = initController();

      ctrl.updateButtonDisplay();

      expect(ctrl.disableButton).to.be.true;
    });

    it('should set disableButton at false is users array is not empty', function() {
      var ctrl = initController();

      ctrl.users.push({});

      ctrl.updateButtonDisplay();

      expect(ctrl.disableButton).to.be.false;
    });
  });

  describe('the addPublicCalendars function', function() {
    var ctrl,
      user,
      calendars,
      listAllCalendarsForUserMock,
      storeAllMock,
      weakErrorMock,
      goMock,
      errorMock;

    beforeEach(function() {
      user = {
        _id: 'kader'
      };
      calendars = {
        calendars: 'my calendars list'
      };

      ctrl = initController();
      ctrl.users.push(user);

      listAllCalendarsForUserMock = sinon.spy(function() {
        return $q.when(calendars);
      });
      goMock = sinon.spy();
      errorMock = sinon.spy();

      sinon.stub(calendarService, 'listAllCalendarsForUser', listAllCalendarsForUserMock);
      sinon.stub($state, 'go', goMock);
      sinon.stub(calPublicCalendarStore, 'storeAll', storeAllMock);
      sinon.stub(notificationFactory, 'weakError', weakErrorMock);
      sinon.stub($log, 'error', errorMock);
    });

    it('should call listAllCalendarsForUserMock with the correct user._id', function() {
      ctrl.addPublicCalendars();

      expect(listAllCalendarsForUserMock).to.have.been.calledWith(user._id);
    });

    it('should call $state.go and calPublicCalendarStore.storeAll when resolved', function() {
      ctrl.addPublicCalendars();

      $rootScope.$digest();

      expect($state.go).to.have.been.calledWith('calendar.main');
      expect(calPublicCalendarStore.storeAll).to.have.been.calledWith(calendars);
    });

    it('should call $log.error and notificationFactory.weakError when reject', function() {
      calendarService.listAllCalendarsForUser.restore();

      var error = 'this is the error message';
      sinon.stub(calendarService, 'listAllCalendarsForUser', sinon.spy(function() {
        return $q.reject(error);
      }));

      ctrl.addPublicCalendars();

      $rootScope.$digest();

      expect(notificationFactory.weakError).to.have.been.calledWith('Could not find public calendars.');
      expect($log.error).to.have.been.calledWith(error);
    });
  });

});
